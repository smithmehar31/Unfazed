import { BrowserRouter, Routes, Route } from "react-router-dom";

import Register from "../pages/auth/Register";
import Login from "../pages/auth/Login";

import Dashboard from "../pages/therapist/Dashboard";
import Profile from "../pages/therapist/Profile";
import Schedule from "../pages/therapist/Schedule";
import Clients from "../pages/therapist/Clients";

import PublicProfile from "../pages/client/PublicProfile";
import BookSession from "../pages/client/BookSession";
import ClientPortal from "../pages/client/ClientPortal";

import ProtectedRoute from "./ProtectedRoute";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<h1>Welcome to Unfazed</h1>}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/profile"
            element={<Profile />}
          />

          <Route
            path="/schedule"
            element={<Schedule />}
          />

          <Route
            path="/clients"
            element={<Clients />}
          />
        </Route>

        <Route
          path="/book/:slug"
          element={<BookSession />}
        />

        <Route
          path="/portal"
          element={<ClientPortal />}
        />

        <Route
          path="/:slug"
          element={<PublicProfile />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;