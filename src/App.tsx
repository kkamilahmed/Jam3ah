import './App.css'
import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Each page loads on demand so the landing and login pages stay small
// (the dashboard pulls in Excel import and maps).
const SignupPage   = lazy(() => import('./pages/SignupPage'));
const LandingPage  = lazy(() => import('./pages/LandingPage'));
const LoginPage    = lazy(() => import('./pages/LoginPage'));
const HomePage     = lazy(() => import('./pages/HomePage'));
const AdminPage    = lazy(() => import('./pages/AdminPage'));
const WelcomePage  = lazy(() => import('./pages/WelcomePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const TvScreenPage = lazy(() => import('./pages/TvScreenPage'));

function App() {
  return (
    <Router>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/home/tvscreen"   element={<TvScreenPage />} />
          <Route path="/home"            element={<Navigate to="/home/overview" replace />} />
          <Route path="/home/:tab"       element={<HomePage />} />
          <Route path="/dashboard"       element={<Navigate to="/home/overview" replace />} />
          <Route path="/onboarding"      element={<WelcomePage />} />
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/signup"          element={<SignupPage />} />
          <Route path="/"                element={<LandingPage />} />
          <Route path="/admin"           element={<AdminPage />} />
          <Route path="*"                element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App
