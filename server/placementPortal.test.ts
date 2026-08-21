/** @vitest-environment jsdom */
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";

const testState = vi.hoisted(() => ({
  auth: { user: null as any, loading: false, logout: vi.fn() },
  setLocation: vi.fn(),
  startLogin: vi.fn(),
}));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => testState.auth }));
vi.mock("wouter", () => ({ useLocation: () => ["/", testState.setLocation] }));
vi.mock("@/const", () => ({ startLogin: testState.startLogin }));
vi.mock("../client/src/legacy/LoginPage.jsx", () => ({ default: () => React.createElement("div", { "data-testid": "legacy-login" }, "Login") }));
vi.mock("../client/src/legacy/CandidateHome.jsx", () => ({ default: () => React.createElement("div", { "data-testid": "candidate-portal" }, "Candidate portal") }));
vi.mock("../client/src/pages/RecruiterHome.jsx", () => ({ default: () => React.createElement("div", { "data-testid": "recruiter-portal" }, "Recruiter portal") }));

import LegacyLanding, { CandidatePortal, RecruiterPortal } from "../client/src/pages/PlacementPortal";

const userFor = (placementRole: "candidate" | "recruiter") => ({
  id: placementRole === "candidate" ? 51 : 52,
  openId: `portal-${placementRole}`,
  name: "Portal Test",
  email: "portal@example.edu",
  loginMethod: "test",
  role: "user",
  placementRole,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
});

describe("PlacementPortal role-aware OAuth shell", () => {
  beforeEach(() => {
    testState.setLocation.mockReset();
    testState.startLogin.mockReset();
    testState.auth = { user: null, loading: false, logout: vi.fn() };
  });

  afterEach(cleanup);

  it("redirects an authenticated candidate from login to /candidate", async () => {
    testState.auth = { user: userFor("candidate"), loading: false, logout: vi.fn() };
    render(React.createElement(LegacyLanding));
    await waitFor(() => expect(testState.setLocation).toHaveBeenCalledWith("/candidate"));
  });

  it("redirects an authenticated recruiter from login to /recruiter", async () => {
    testState.auth = { user: userFor("recruiter"), loading: false, logout: vi.fn() };
    render(React.createElement(LegacyLanding));
    await waitFor(() => expect(testState.setLocation).toHaveBeenCalledWith("/recruiter"));
  });

  it("renders only the permitted candidate portal and redirects cross-role access", async () => {
    testState.auth = { user: userFor("candidate"), loading: false, logout: vi.fn() };
    const candidateView = render(React.createElement(CandidatePortal));
    expect(screen.getByTestId("candidate-portal")).toBeTruthy();
    candidateView.unmount();

    render(React.createElement(RecruiterPortal));
    await waitFor(() => expect(testState.setLocation).toHaveBeenCalledWith("/candidate"));
    expect(screen.queryByTestId("recruiter-portal")).toBeNull();
  });

  it("renders only the permitted recruiter portal and redirects cross-role access", async () => {
    testState.auth = { user: userFor("recruiter"), loading: false, logout: vi.fn() };
    const recruiterView = render(React.createElement(RecruiterPortal));
    expect(screen.getByTestId("recruiter-portal")).toBeTruthy();
    recruiterView.unmount();

    render(React.createElement(CandidatePortal));
    await waitFor(() => expect(testState.setLocation).toHaveBeenCalledWith("/recruiter"));
    expect(screen.queryByTestId("candidate-portal")).toBeNull();
  });
});
