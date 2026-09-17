import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Import pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdopterDashboard from "./pages/AdopterDashboard";
import Questionnaire from "./pages/Questionnaire";
import Recommendations from "./pages/Recommendations";
import PetDetails from "./pages/PetDetails";
import AdoptionApplication from "./pages/AdoptionApplication";
import ShelterDashboard from "./pages/ShelterDashboard";
import ApplicationReview from "./pages/ApplicationReview";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Adopter pages */}
        <Route
          path="/adopter-dashboard"
          element={<AdopterDashboard />}
        />

        <Route
          path="/questionnaire"
          element={<Questionnaire />}
        />

        <Route
          path="/recommendations"
          element={<Recommendations />}
        />

        <Route
          path="/pet/:petId"
          element={<PetDetails />}
        />

        <Route
          path="/application/:petId"
          element={<AdoptionApplication />}
        />

        {/* Shelter Staff pages */}
        <Route
          path="/shelter-dashboard"
          element={<ShelterDashboard />}
        />

        <Route
          path="/application-review/:applicationId"
          element={<ApplicationReview />}
        />

        {/* Default route */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* Page not found */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;