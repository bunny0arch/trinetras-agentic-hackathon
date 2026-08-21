import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  ensurePlacementDemoData,
  getCandidateProfileForUser,
  getPlacementSnapshot,
  listPlacementDrives,
  listRecruiterCandidates,
  listRecruiterSchedule,
  listNotificationsForUser,
  updatePlacementApplicationStatus,
  verifyPlacementApplication,
} from "../db";
import { requirePlacementRole } from "../placementAuth";
import { protectedProcedure, router } from "../_core/trpc";

export const placementRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => ({
    placementRole: ctx.user.placementRole,
    userId: ctx.user.id,
  })),
  candidate: router({
    dashboard: protectedProcedure.query(async ({ ctx }) => {
      requirePlacementRole(ctx.user, "candidate");
      const [profile, snapshot, notificationRows] = await Promise.all([
        getCandidateProfileForUser(ctx.user.id),
        getPlacementSnapshot(),
        listNotificationsForUser(ctx.user.id),
      ]);
      const profileApplications = snapshot.applications.filter((row) => row.candidateProfileId === profile?.id);
      return { profile, drives: snapshot.drives.filter((row) => row.published === 1), applications: profileApplications, notifications: notificationRows };
    }),
  }),
  recruiter: router({
    dashboard: protectedProcedure.query(async ({ ctx }) => {
      requirePlacementRole(ctx.user, "recruiter");
      const snapshot = await getPlacementSnapshot();
      const activeDrives = snapshot.drives.filter((row) => row.published === 1);
      const shortlisted = snapshot.applications.filter((row) => row.status === "shortlisted");
      const scheduled = snapshot.interviews.filter((row) => row.status === "confirmed" || row.status === "pending");
      return {
        stats: {
          totalStudents: snapshot.candidates.length,
          eligibleStudents: snapshot.applications.filter((row) => row.eligibilityStatus === "eligible").length,
          activeDrives: activeDrives.length,
          applicationsReceived: snapshot.applications.length,
          shortlistedCandidates: shortlisted.length,
          interviewsScheduled: scheduled.length,
          placedStudents: snapshot.candidates.filter((row) => row.placementStatus === "placed").length,
        },
        drives: activeDrives,
        interviews: scheduled,
      };
    }),
    candidates: protectedProcedure.query(async ({ ctx }) => {
      requirePlacementRole(ctx.user, "recruiter");
      return listRecruiterCandidates();
    }),
    drives: protectedProcedure.query(async ({ ctx }) => {
      requirePlacementRole(ctx.user, "recruiter");
      return listPlacementDrives();
    }),
    schedule: protectedProcedure.query(async ({ ctx }) => {
      requirePlacementRole(ctx.user, "recruiter");
      return listRecruiterSchedule();
    }),
    updateApplicationStatus: protectedProcedure
      .input(z.object({ applicationId: z.string().uuid(), status: z.enum(["submitted", "shortlisted", "assessment_pending", "interviewing", "rejected", "offered"]) }))
      .mutation(async ({ ctx, input }) => {
        requirePlacementRole(ctx.user, "recruiter");
        return updatePlacementApplicationStatus(input.applicationId, input.status);
      }),
    verifyApplication: protectedProcedure
      .input(z.object({ candidateProfileId: z.string().uuid(), driveId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        requirePlacementRole(ctx.user, "recruiter");
        return verifyPlacementApplication(input.candidateProfileId, input.driveId);
      }),
  }),
});
