import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getCandidateProfileForUser, getPlacementDriveByTitle, getPlacementSnapshot } from "../db";
import { invokePlacementModel } from "../openrouter";
import { isPresentationDemoUser, requirePlacementRole } from "../placementAuth";
import { protectedProcedure, router } from "../_core/trpc";

const eligibilitySchema = {
  type: "json_schema" as const,
  json_schema: {
    name: "placement_eligibility",
    strict: true,
    schema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["Eligible", "Review needed", "Not eligible"] },
        explanation: { type: "string" },
        criteria: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              met: { type: "boolean" },
              rationale: { type: "string" },
            },
            required: ["label", "met", "rationale"],
            additionalProperties: false,
          },
        },
      },
      required: ["status", "explanation", "criteria"],
      additionalProperties: false,
    },
  },
};

const skillMatchSchema = {
  type: "json_schema" as const,
  json_schema: {
    name: "placement_skill_match",
    strict: true,
    schema: {
      type: "object",
      properties: {
        score: { type: "integer", minimum: 0, maximum: 100 },
        matchedSkills: { type: "array", items: { type: "string" } },
        skillGaps: { type: "array", items: { type: "string" } },
        explanation: { type: "string" },
      },
      required: ["score", "matchedSkills", "skillGaps", "explanation"],
      additionalProperties: false,
    },
  },
};

function messageContent(response: Awaited<ReturnType<typeof invokePlacementModel>>) {
  const content = response.choices[0]?.message.content;
  if (!content || typeof content !== "string") {
    throw new TRPCError({ code: "BAD_GATEWAY", message: "The placement intelligence service returned no textual answer." });
  }
  return content;
}

async function candidateContext(userId: number, opportunityTitle: string) {
  const [candidate, drive] = await Promise.all([
    getCandidateProfileForUser(userId),
    getPlacementDriveByTitle(opportunityTitle),
  ]);
  if (!candidate || !drive) throw new TRPCError({ code: "NOT_FOUND", message: "Candidate profile or placement drive was not found." });
  return { candidate, drive };
}

export const aiRouter = router({
  checkEligibility: protectedProcedure
    .input(z.object({ opportunityTitle: z.string().min(1).max(160) }))
    .query(async ({ ctx, input }) => {
      requirePlacementRole(ctx.user, "candidate");
      const { candidate, drive } = await candidateContext(ctx.user.id, input.opportunityTitle);
      const response = await invokePlacementModel({
        messages: [
          {
            role: "system",
            content: "You are a careful campus placement eligibility analyst. Evaluate only the explicit academic, department, graduation-batch, backlog, and skill requirements supplied. Never infer missing facts, use protected characteristics, or invent criteria. If data is incomplete or the rules are ambiguous, return Review needed.",
          },
          {
            role: "user",
            content: JSON.stringify({
              candidate: { batch: candidate.batch, department: candidate.department, cgpa: candidate.cgpa, backlogs: candidate.backlogs, skills: candidate.skills },
              drive: { title: drive.title, minCgpa: drive.minCgpa, maxBacklogs: drive.maxBacklogs, graduationBatch: drive.graduationBatch, allowedDepartments: drive.allowedDepartments, requiredSkills: drive.requiredSkills },
            }),
          },
        ],
        response_format: eligibilitySchema,
      });
      return JSON.parse(messageContent(response));
    }),
  getSkillMatch: protectedProcedure
    .input(z.object({ opportunityTitle: z.string().min(1).max(160) }))
    .query(async ({ ctx, input }) => {
      requirePlacementRole(ctx.user, "candidate");
      const { candidate, drive } = await candidateContext(ctx.user.id, input.opportunityTitle);
      const response = await invokePlacementModel({
        messages: [
          {
            role: "system",
            content: "You are a transparent campus placement skill-matching analyst. Compare only the stated candidate skills, projects, and certifications with the drive's stated required skills. Assign a 0-100 score based on explicit overlap. Do not infer skills, use protected characteristics, or make a hiring decision.",
          },
          {
            role: "user",
            content: JSON.stringify({
              candidate: { skills: candidate.skills, projects: candidate.projects, certifications: candidate.certifications },
              drive: { title: drive.title, requiredSkills: drive.requiredSkills },
            }),
          },
        ],
        response_format: skillMatchSchema,
      });
      return JSON.parse(messageContent(response));
    }),
  askPlacementAssistant: protectedProcedure
    .input(z.object({ question: z.string().min(1).max(1200) }))
    .query(async ({ ctx, input }) => {
      requirePlacementRole(ctx.user, "candidate");
      const [candidate, snapshot] = await Promise.all([getCandidateProfileForUser(ctx.user.id), getPlacementSnapshot(isPresentationDemoUser(ctx.user))]);
      const response = await invokePlacementModel({
        messages: [
          {
            role: "system",
            content: "You are a concise campus placement assistant. Give practical, supportive advice grounded only in the candidate profile and placement data supplied. Do not claim to make final hiring decisions. Use short paragraphs and end with up to three concrete next actions.",
          },
          {
            role: "user",
            content: JSON.stringify({ question: input.question, candidate, drives: snapshot.drives, applications: snapshot.applications.filter((row) => row.candidateProfileId === candidate?.id), interviews: snapshot.interviews }),
          },
        ],
      });
      return { answer: messageContent(response), source: "placement-llm", nextActions: ["Review your matching opportunities", "Update evidence in your profile"] };
    }),
  recruiterAssistant: protectedProcedure
    .input(z.object({ question: z.string().min(1).max(1200) }))
    .query(async ({ ctx, input }) => {
      requirePlacementRole(ctx.user, "recruiter");
      const snapshot = await getPlacementSnapshot(isPresentationDemoUser(ctx.user));
      const response = await invokePlacementModel({
        messages: [
          {
            role: "system",
            content: "You are the AI placement manager for an institution. Analyze only the supplied operational data, surface bottlenecks, conflicts, and recommended next actions. Keep recommendations explainable and do not make an autonomous hiring decision.",
          },
          { role: "user", content: JSON.stringify({ question: input.question, snapshot }) },
        ],
      });
      return { answer: messageContent(response) };
    }),
});
