import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import fetch from "node-fetch";

admin.initializeApp();
const db = admin.firestore();

setGlobalOptions({ region: "us-central1", maxInstances: 10 });

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8080";

// ============================================
// HEALTH CHECK
// ============================================
export const ping = onRequest((req, res) => {
  res.json({ status: "ok", service: "adoptly-backend" });
});

// ============================================
// GENERATE RECOMMENDATIONS
// ============================================
export const generateRecommendations = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Login required");
  }
  const adopterId = request.auth.uid;

  try {
    const adopterSnap = await db
      .collection("users")
      .doc(adopterId)
      .collection("adopterProfiles")
      .doc("main")
      .get();

    if (!adopterSnap.exists) {
      throw new HttpsError("not-found", "Complete your profile first");
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

    const recommendations: any[] = [];
    for (const petDoc of petsSnap.docs) {
      const pet = petDoc.data();
      const payload = {
        pet: {
          species: pet.species,
          breed: pet.breed,
          age: pet.age,
          size: pet.size,
          energyLevel: pet.energyLevel,
          healthStatus: pet.healthStatus,
        },
        adopter: {
          // ✅ Uses the numeric value
          activityLevel: adopter.activityLevelNumeric ?? 3, 
          careHoursNumeric: adopter.careHoursNumeric,
          housingTypeEncoded: adopter.housingTypeEncoded,
          hasChildrenUnder12: adopter.hasChildrenUnder12,
          hasOtherPets: adopter.hasOtherPets,
          experienceLevel: adopter.experienceLevel,
          groomingTolerance: adopter.groomingTolerance,
          age: adopter.age,
        },
      };

      try {
        const response = await fetch(`${ML_SERVICE_URL}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = (await response.json()) as any;

        recommendations.push({
          petId: petDoc.id,
          petName: pet.name,
          petBreed: pet.breed,
          petPhotoUrl: pet.photoUrl || "",
          compatibilityScore: result.compatibility_score,
          topFactors: result.top_factors,
        });
      } catch (err) {
        console.error(`ML call failed for pet ${petDoc.id}`, err);
      }
    }

    recommendations.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    const top5 = recommendations.slice(0, 5);

    const batch = db.batch();
    for (const rec of top5) {
      const ref = db.collection("compatibilityScores").doc();
      batch.set(ref, {
        adopterId,
        petId: rec.petId,
        score: rec.compatibilityScore,
        shapValues: rec.topFactors,
        // ✅ FIXED: Removed `admin.firestore.` prefix
        generatedAt: FieldValue.serverTimestamp(), 
      });
    }
    await batch.commit();

    return { recommendations: top5 };

  } catch (error: any) {
    console.error("🔥 generateRecommendations crashed:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "Unknown error occurred");
  }
});

// ============================================
// AUTO-ASSIGN ROLE & SET CUSTOM CLAIMS
// ============================================
export const onUserDocCreated = onDocumentCreated(
  "users/{userId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const data = snap.data();
    const email = data.email || "";
    const userId = event.params.userId;

    const shelterEmails = [
      "@adoptly-shelter.org",
      "ritararin@gmail.com", 
    ];
    
    const isShelter = shelterEmails.some((e) => email.endsWith(e));
    const role = isShelter ? "shelter" : "adopter";

    await snap.ref.set(
      { role: role, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );

    try {
      await admin.auth().setCustomUserClaims(userId, {
        role: "authenticated",
        appRole: role,
      });
      console.log(`✅ Successfully set role '${role}' for user ${email}`);
    } catch (error) {
      console.error(`❌ Failed to set custom claims for user ${userId}`, error);
    }
  }
);

// ============================================
// GENERATE GOOGLE MEET LINK (LAZY LOADED)
// ============================================
export const scheduleInterview = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Login required");
  }

  const { applicationId, petName, adopterEmail, shelterEmail, dateTime } = request.data;

  if (!applicationId || !dateTime) {
    throw new HttpsError("invalid-argument", "Missing required fields");
  }

  if (adopterEmail.endsWith('.test') || shelterEmail.endsWith('.test')) {
    throw new HttpsError(
      "invalid-argument", 
      "Google Meet cannot send invites to '.test' emails. Please use real email addresses in the application."
    );
  }

  try {
    // ✅ LAZY LOAD: Only load the heavy googleapis library when this function is actually called
    const { google } = require("googleapis");

    const oauth2Client = new google.auth.OAuth2(
      process.env.OAUTH_CLIENT_ID,
      process.env.OAUTH_CLIENT_SECRET,
      "https://developers.google.com/oauthplayground" 
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.OAUTH_REFRESH_TOKEN,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const eventRequest = {
      summary: `Adoptly Interview: ${petName}`,
      description: `Virtual verification meeting for application ${applicationId}.`,
      start: { dateTime, timeZone: "Africa/Nairobi" },
      end: { 
        dateTime: new Date(new Date(dateTime).getTime() + 30 * 60000).toISOString(), 
        timeZone: "Africa/Nairobi" 
      },
      attendees: [{ email: adopterEmail }, { email: shelterEmail }],
      conferenceData: {
        createRequest: {
          requestId: `adoptly-${applicationId}-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    };

    const event = await calendar.events.insert({
      calendarId: "primary",
      requestBody: eventRequest,
      conferenceDataVersion: 1, 
      sendUpdates: "all",       
    });

    const meetLink = event.data.hangoutLink || event.data.conferenceData?.entryPoints?.[0]?.uri;
    
    if (!meetLink) {
      throw new Error("Failed to generate Meet link.");
    }

    await db.collection("adoptionApplications").doc(applicationId).update({
      interviewLink: meetLink,
      interviewScheduledAt: dateTime,
      status: "Interview Scheduled",
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true, meetLink };
  } catch (error: any) {
    console.error("Meet API Error Details:", error);
    throw new HttpsError("internal", "Could not schedule interview", error.message);
  }
});