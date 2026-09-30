import { BrowserRouter, Routes, Route } from "react-router-dom";

import Register from "../pages/auth/Register";
import Login from "../pages/auth/Login";
import Dashboard from "../pages/therapist/Dashboard";
import Profile from "../pages/therapist/Profile";
import PublicProfile from "../pages/client/PublicProfile";

import ProtectedRoute from "./ProtectedRoute";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Home */}
        <Route
          path="/"
          element={<h1>Welcome to Unfazed</h1>}
        />

        {/* Public Authentication */}
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* Protected Therapist Pages */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/profile"
            element={<Profile />}
          />
        </Route>

        {/* Public Therapist Profile */}
        <Route
          path="/:slug"
          element={<PublicProfile />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;