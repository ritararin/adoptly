
import {
  onCall,
  onRequest,
  HttpsError,
} from "firebase-functions/v2/https";

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import fetch from "node-fetch";

admin.initializeApp();

const db = admin.firestore();

setGlobalOptions({
  region: "us-central1",
  maxInstances: 10,
});

// Set ML_SERVICE_URL to a URL reachable from the environment running
// this function. A deployed function cannot reach your computer's localhost.
const ML_SERVICE_URL = (process.env.ML_SERVICE_URL || "").replace(/\/+$/, "");

// ---------- HEALTH CHECK ----------

export const ping = onRequest((_req, res) => {
  res.json({
    status: "ok",
    service: "adoptly-backend",
  });
});

// ---------- GENERATE RECOMMENDATIONS ----------

export const generateRecommendations = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Login required");
  }

  const adopterId = request.auth.uid;

  try {
    // Read the adopter profile from the same project used by this function.
    const adopterSnap = await db
      .collection("users")
      .doc(adopterId)
      .collection("adopterProfiles")
      .doc("main")
      .get();

    if (!adopterSnap.exists) {
      console.error(
        "Adopter profile not found for authenticated UID:",
        adopterId
      );

      throw new HttpsError(
        "not-found",
        "Complete your profile first. Your saved profile was not found for this signed-in account."
      );
    }

    const adopter = adopterSnap.data()!;

    const petsSnap = await db
      .collection("pets")
      .where("adoptionStatus", "==", "Available")
      .limit(30)
      .get();

    if (petsSnap.empty) {
      return { recommendations: [] };
    }

    if (!ML_SERVICE_URL) {
      console.error("ML_SERVICE_URL has not been configured.");

      throw new HttpsError(
        "failed-precondition",
        "The ML prediction service is not configured. Set ML_SERVICE_URL to a reachable prediction API URL."
      );
    }

    const recommendations: Array<{
      petId: string;
      petName: string;
      petBreed: string;
      petPhotoUrl: string;
      compatibilityScore: number;
      topFactors: any[];
    }> = [];

    let failedPredictions = 0;

    for (const petDoc of petsSnap.docs) {
      const pet = petDoc.data();

      const payload = {
        pet: {
          species: pet.species ?? null,
          breed: pet.breed ?? null,
          age: pet.age ?? null,
          size: pet.size ?? null,
          energyLevel: pet.energyLevel ?? null,
          healthStatus: pet.healthStatus ?? null,
        },
        adopter: {
          activityLevel: adopter.activityLevelNumeric ?? 3,
          careHoursNumeric: adopter.careHoursNumeric ?? null,
          housingTypeEncoded: adopter.housingTypeEncoded ?? null,
          hasChildrenUnder12: adopter.hasChildrenUnder12 ?? null,
          hasOtherPets: adopter.hasOtherPets ?? null,
          experienceLevel: adopter.experienceLevel ?? null,
          groomingTolerance: adopter.groomingTolerance ?? null,
          age: adopter.age ?? null,
        },
      };

      try {
        const response = await fetch(`${ML_SERVICE_URL}/predict`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const responseText = await response.text();

          throw new Error(
            `ML service returned HTTP ${response.status}: ${responseText.slice(0, 300)}`
          );
        }

        const result = (await response.json()) as {
          compatibility_score?: unknown;
          top_factors?: unknown;
        };

        const score = Number(result.compatibility_score);

        if (
          result.compatibility_score === undefined ||
          result.compatibility_score === null ||
          !Number.isFinite(score)
        ) {
          throw new Error(
            "The ML service did not return a valid compatibility_score."
          );
        }

        const topFactors = Array.isArray(result.top_factors)
          ? result.top_factors
          : [];

        recommendations.push({
          petId: petDoc.id,
          petName: pet.name ?? "Unnamed pet",
          petBreed: pet.breed ?? "Unknown breed",
          petPhotoUrl: pet.photoUrl ?? "",
          compatibilityScore: score,
          topFactors,
        });
      } catch (error) {
        failedPredictions++;

        console.error(
          `ML prediction failed for pet ${petDoc.id}:`,
          error
        );
      }
    }

    // Avoid reporting "no pets" when pets exist but every ML call failed.
    if (recommendations.length === 0 && failedPredictions > 0) {
      throw new HttpsError(
        "internal",
        "We found available pets, but the ML prediction service failed for all of them. Check ML_SERVICE_URL and the ML service logs."
      );
    }

    recommendations.sort(
      (a, b) => b.compatibilityScore - a.compatibilityScore
    );

    const top5 = recommendations.slice(0, 5);

    if (top5.length > 0) {
      const batch = db.batch();

      for (const recommendation of top5) {
        const scoreRef = db.collection("compatibilityScores").doc();

        batch.set(scoreRef, {
          adopterId,
          petId: recommendation.petId,
          score: recommendation.compatibilityScore,
          shapValues: recommendation.topFactors,
          generatedAt: FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();
    }

    return {
      recommendations: top5,
    };
  } catch (error: unknown) {
    console.error("generateRecommendations failed:", error);

    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError(
      "internal",
      "Could not generate recommendations. Check the backend logs for details."
    );
  }
});

// ---------- AUTO-ASSIGN ROLE AND SET CUSTOM CLAIMS ----------

export const onUserDocCreated = onDocumentCreated(
  "users/{userId}",
  async (event) => {
    const snap = event.data;

    if (!snap) return;

    const data = snap.data();
    const email = String(data.email || "").toLowerCase().trim();
    const userId = event.params.userId;

    const shelterEmails = [
      "ritararin@gmail.com",
    ];

    const shelterDomains = [
      "@adoptly-shelter.org",
    ];

    const isShelter =
      shelterEmails.includes(email) ||
      shelterDomains.some((domain) => email.endsWith(domain));

    const role = isShelter ? "shelter" : "adopter";

    await snap.ref.set(
      {
        role,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    try {
      await admin.auth().setCustomUserClaims(userId, {
        role: "authenticated",
        appRole: role,
      });

      console.log(
        `Successfully set role '${role}' for user ${userId}`
      );
    } catch (error) {
      console.error(
        `Failed to set custom claims for user ${userId}:`,
        error
      );
    }
  }
);

// ---------- GENERATE GOOGLE MEET LINK ----------

export const scheduleInterview = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Login required");
  }

  const {
    applicationId,
    petName,
    adopterEmail,
    shelterEmail,
    dateTime,
  } = request.data ?? {};

  if (!applicationId || !dateTime || !adopterEmail || !shelterEmail) {
    throw new HttpsError(
      "invalid-argument",
      "Application ID, date/time, adopter email, and shelter email are required."
    );
  }

  if (
    String(adopterEmail).endsWith(".test") ||
    String(shelterEmail).endsWith(".test")
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Google Meet invitations require real email addresses."
    );
  }

  const startDate = new Date(dateTime);

  if (Number.isNaN(startDate.getTime())) {
    throw new HttpsError(
      "invalid-argument",
      "The interview date and time are invalid."
    );
  }

  try {
    // Load Google APIs only when this function is called.
    const { google } = require("googleapis");

    const oauth2Client = new google.auth.OAuth2(
      process.env.OAUTH_CLIENT_ID,
      process.env.OAUTH_CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.OAUTH_REFRESH_TOKEN,
    });

    const calendar = google.calendar({
      version: "v3",
      auth: oauth2Client,
    });

    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

    const eventRequest = {
      summary: `Adoptly Interview: ${petName || "Pet adoption"}`,
      description: `Virtual verification meeting for application ${applicationId}.`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: "Africa/Nairobi",
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: "Africa/Nairobi",
      },
      attendees: [
        { email: adopterEmail },
        { email: shelterEmail },
      ],
      conferenceData: {
        createRequest: {
          requestId: `adoptly-${applicationId}-${Date.now()}`,
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      },
    };

    const event = await calendar.events.insert({
      calendarId: "primary",
      requestBody: eventRequest,
      conferenceDataVersion: 1,
      sendUpdates: "all",
    });

    const meetLink =
      event.data.hangoutLink ||
      event.data.conferenceData?.entryPoints?.find(
        (entry: { entryPointType?: string; uri?: string }) =>
          entry.entryPointType === "video"
      )?.uri;

    if (!meetLink) {
      throw new Error("Google Calendar did not return a Meet link.");
    }

    await db
      .collection("adoptionApplications")
      .doc(applicationId)
      .update({
        interviewLink: meetLink,
        interviewScheduledAt: startDate.toISOString(),
        status: "Interview Scheduled",
        updatedAt: FieldValue.serverTimestamp(),
      });

    return {
      success: true,
      meetLink,
    };
  } catch (error: unknown) {
    console.error("Google Meet scheduling failed:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      "internal",
      "Could not schedule the interview. Check the Google Calendar configuration and backend logs."
    );
  }
});
