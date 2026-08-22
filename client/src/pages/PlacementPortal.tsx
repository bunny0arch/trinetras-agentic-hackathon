import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { placementDestination, type PlacementRole } from "@/lib/placementRouting";
import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import LegacyLoginPage from "../legacy/LoginPage.jsx";
import LegacyCandidateHome from "../legacy/CandidateHome.jsx";
import RecruiterHome from "./RecruiterHome.jsx";

function LoadingScreen() {
  return <div className="placement-loading">Loading your placement workspace…</div>;
}

function LegacyLanding() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [authConfigError, setAuthConfigError] = useState(false);

  useEffect(() => {
    if (!loading && user) setLocation(placementDestination(user.placementRole));
  }, [loading, setLocation, user]);

  useEffect(() => {
    const onConfigError = () => setAuthConfigError(true);
    window.addEventListener("placement-auth-config-error", onConfigError);
    return () => window.removeEventListener("placement-auth-config-error", onConfigError);
  }, []);

  return <div>{authConfigError && <p className="auth-config-error">Sign-in is temporarily unavailable because this deployment is missing its OAuth configuration.</p>}<LegacyLoginPage /></div>;
}

function ProtectedPortal({ role }: { role: PlacementRole }) {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      startLogin(role);
      return;
    }
    if (user.placementRole !== role) {
      setLocation(placementDestination(user.placementRole));
    }
  }, [loading, role, setLocation, user]);

  if (loading || !user || user.placementRole !== role) return <LoadingScreen />;

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return role === "candidate"
    ? <LegacyCandidateHome onLogout={handleLogout} />
    : <RecruiterHome onLogout={handleLogout} user={user} />;
}

export function CandidatePortal() {
  return <ProtectedPortal role="candidate" />;
}

export function RecruiterPortal() {
  return <ProtectedPortal role="recruiter" />;
}

export default LegacyLanding;
