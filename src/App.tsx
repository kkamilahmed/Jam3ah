import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import SignupPage    from './pages/SignupPage';
import LandingPage   from './pages/LandingPage';
import LoginPage     from './pages/LoginPage';
import HomePage      from './pages/HomePage';
import AdminPage     from './pages/AdminPage';
import WelcomePage   from './pages/WelcomePage';
import NotFoundPage  from './pages/NotFoundPage';

function App() {
  return (
    <Router>
      <Routes>
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
    </Router>
  );
}

export default App
