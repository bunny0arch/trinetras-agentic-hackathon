import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { type InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { supabase } from "./supabase";

let authDatabase: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!authDatabase && process.env.DATABASE_URL) authDatabase = drizzle(process.env.DATABASE_URL);
  return authDatabase;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) throw new Error("Authentication database is unavailable");
  const placementRole = user.placementRole ?? (user.openId === ENV.ownerOpenId ? "recruiter" : "candidate");
  await db.insert(users).values({
    openId: user.openId,
    name: user.name ?? null,
    email: user.email ?? null,
    loginMethod: user.loginMethod ?? null,
    role: user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user"),
    placementRole,
    lastSignedIn: user.lastSignedIn ?? new Date(),
  }).onDuplicateKeyUpdate({
    set: { name: user.name ?? null, email: user.email ?? null, loginMethod: user.loginMethod ?? null, lastSignedIn: new Date() },
  });

  const persisted = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);
  const identity = persisted[0];
  if (!identity) throw new Error("Authenticated user could not be loaded for Supabase synchronization");
  const synced = await supabase.from("placement_users").upsert({
    manus_user_id: identity.id,
    open_id: identity.openId,
    name: identity.name,
    email: identity.email,
    placement_role: placementRole,
    updated_at: new Date().toISOString(),
  }, { onConflict: "open_id" }).select("id").single();
  const placementIdentity = unwrap(synced) as { id: string };
  if (placementRole === "candidate" && identity.email) {
    const candidateProfile = unwrap(await supabase.from("candidate_profiles").select("id").eq("email", identity.email).limit(1).maybeSingle()) as { id: string } | null;
    if (candidateProfile) {
      unwrap(await supabase.from("candidate_profiles").update({ placement_user_id: placementIdentity.id }).eq("id", candidateProfile.id));
    }
  }
  const existingNotification = unwrap(await supabase.from("notifications").select("id").eq("placement_user_id", placementIdentity.id).limit(1)) as Array<{ id: string }> | null;
  if (!existingNotification?.[0]) {
    unwrap(await supabase.from("notifications").insert({
      placement_user_id: placementIdentity.id,
      title: placementRole === "recruiter" ? "Recruiter workspace ready" : "Candidate workspace ready",
      body: placementRole === "recruiter" ? "Your placement operations dashboard is connected to Supabase." : "Your placement opportunities and interview coordination workspace is connected to Supabase.",
      kind: "system",
    }));
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  const user = result[0];
  if (!user) return undefined;
  const placementIdentity = unwrap(await supabase.from("placement_users").select("placement_role").eq("open_id", openId).limit(1).maybeSingle()) as { placement_role: "candidate" | "recruiter" } | null;
  if (!placementIdentity) {
    await upsertUser(user);
    return user;
  }
  return { ...user, placementRole: placementIdentity.placement_role };
}

type CandidateProfile = {
  id: string; placement_user_id: string | null; student_code: string; full_name: string; email: string | null; batch: string; department: string; cgpa: string; backlogs: number; skills: string[]; projects: string[]; certifications: string[]; resume_url: string | null; profile_completion: number; placement_status: "searching" | "interviewing" | "placed"; created_at: string; updated_at: string;
};
type PlacementDrive = {
  id: string; company: string; title: string; location: string; package_lpa: string; deadline: string; min_cgpa: string; max_backlogs: number; graduation_batch: string; allowed_departments: string[]; required_skills: string[]; published: boolean; created_by_user_id: string | null; created_at: string; updated_at: string;
};
type Application = {
  id: string; candidate_profile_id: string; placement_drive_id: string; status: "submitted" | "shortlisted" | "assessment_pending" | "interviewing" | "rejected" | "offered"; eligibility_status: "eligible" | "review" | "ineligible"; match_score: number; eligibility_explanation: string | null; skill_gaps: string[]; created_at: string; updated_at: string;
};
type Interview = {
  id: string; application_id: string; panel_id: string | null; room_id: string | null; scheduled_at: string; duration_minutes: number; mode: "video" | "in_person"; status: "pending" | "confirmed" | "completed" | "rescheduled"; outcome: "advance" | "hold" | "reject" | null; created_at: string; updated_at: string;
};

const presentationDemoProfile: CandidateProfile = {
  id: "00000000-0000-4000-8000-000000000001",
  placement_user_id: null,
  student_code: "DEMO-2026",
  full_name: "Presentation Candidate",
  email: "test+candidate@presentation.local",
  batch: "2026",
  department: "Computer Science",
  cgpa: "8.40",
  backlogs: 0,
  skills: ["React", "JavaScript", "CSS", "Figma", "SQL"],
  projects: ["Placement companion"],
  certifications: ["SQL Fundamentals"],
  resume_url: null,
  profile_completion: 84,
  placement_status: "interviewing",
  created_at: "2026-08-20T00:00:00.000Z",
  updated_at: "2026-08-20T00:00:00.000Z",
};

const presentationDemoDrives: PlacementDrive[] = [
  {
    id: "00000000-0000-4000-8000-000000000011",
    company: "Northstar Labs",
    title: "Product Design Intern",
    location: "Bengaluru · Hybrid",
    package_lpa: "12.00",
    deadline: "2026-08-24T18:30:00.000Z",
    min_cgpa: "7.00",
    max_backlogs: 0,
    graduation_batch: "2026",
    allowed_departments: ["Design", "Computer Science", "Information Technology"],
    required_skills: ["Figma", "User research", "Prototyping"],
    published: true,
    created_by_user_id: null,
    created_at: "2026-08-20T00:00:00.000Z",
    updated_at: "2026-08-20T00:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000012",
    company: "Vertex Systems",
    title: "Frontend Engineer",
    location: "Remote · India",
    package_lpa: "16.00",
    deadline: "2026-08-27T18:30:00.000Z",
    min_cgpa: "7.50",
    max_backlogs: 0,
    graduation_batch: "2026",
    allowed_departments: ["Computer Science", "Information Technology"],
    required_skills: ["React", "JavaScript", "CSS"],
    published: true,
    created_by_user_id: null,
    created_at: "2026-08-20T00:00:00.000Z",
    updated_at: "2026-08-20T00:00:00.000Z",
  },
];

const presentationDemoApplications: Application[] = [
  {
    id: "00000000-0000-4000-8000-000000000021",
    candidate_profile_id: presentationDemoProfile.id,
    placement_drive_id: presentationDemoDrives[1].id,
    status: "shortlisted",
    eligibility_status: "eligible",
    match_score: 92,
    eligibility_explanation: "Demo data: the profile meets the displayed batch, CGPA, department, backlog, and skill criteria.",
    skill_gaps: [],
    created_at: "2026-08-20T00:00:00.000Z",
    updated_at: "2026-08-20T00:00:00.000Z",
  },
];

const candidateDto = (value: CandidateProfile) => ({ id: value.id, placementUserId: value.placement_user_id, studentCode: value.student_code, fullName: value.full_name, email: value.email, batch: value.batch, department: value.department, cgpa: value.cgpa, backlogs: value.backlogs, skills: value.skills, projects: value.projects, certifications: value.certifications, resumeUrl: value.resume_url, profileCompletion: value.profile_completion, placementStatus: value.placement_status, createdAt: new Date(value.created_at), updatedAt: new Date(value.updated_at) });
const driveDto = (value: PlacementDrive) => ({ id: value.id, company: value.company, title: value.title, location: value.location, packageLpa: value.package_lpa, deadline: new Date(value.deadline), minCgpa: value.min_cgpa, maxBacklogs: value.max_backlogs, graduationBatch: value.graduation_batch, allowedDepartments: value.allowed_departments, requiredSkills: value.required_skills, published: value.published ? 1 : 0, createdByUserId: value.created_by_user_id, createdAt: new Date(value.created_at), updatedAt: new Date(value.updated_at) });
const applicationDto = (value: Application) => ({ id: value.id, candidateProfileId: value.candidate_profile_id, placementDriveId: value.placement_drive_id, status: value.status, eligibilityStatus: value.eligibility_status, matchScore: value.match_score, eligibilityExplanation: value.eligibility_explanation, skillGaps: value.skill_gaps, createdAt: new Date(value.created_at), updatedAt: new Date(value.updated_at) });
const interviewDto = (value: Interview) => ({ id: value.id, applicationId: value.application_id, panelId: value.panel_id, roomId: value.room_id, scheduledAt: new Date(value.scheduled_at), durationMinutes: value.duration_minutes, mode: value.mode, status: value.status, outcome: value.outcome, createdAt: new Date(value.created_at), updatedAt: new Date(value.updated_at) });

function unwrap<T>(result: { data: T | null; error: { message: string } | null }) {
  if (result.error) throw new Error(`Supabase placement query failed: ${result.error.message}`);
  return result.data;
}

export async function ensurePlacementDemoData() {
  const data = unwrap(await supabase.from("placement_drives").select("id", { count: "exact", head: true }));
  return data;
}

export async function getCandidateProfileForUser(userId: number) {
  if (userId === -1001) {
    const demoProfile = unwrap(await supabase.from("candidate_profiles").select("*").eq("student_code", "DEMO-2026").limit(1).maybeSingle()) as CandidateProfile | null;
    return candidateDto(demoProfile ?? presentationDemoProfile);
  }
  const identity = unwrap(await supabase.from("placement_users").select("id").eq("manus_user_id", userId).limit(1).maybeSingle()) as { id: string } | null;
  if (!identity) return undefined;
  const profile = unwrap(await supabase.from("candidate_profiles").select("*").eq("placement_user_id", identity.id).limit(1).maybeSingle()) as CandidateProfile | null;
  return profile ? candidateDto(profile) : undefined;
}

export async function ensureDemoCandidateProfile(userId: number) {
  const identity = unwrap(await supabase.from("placement_users").select("id").eq("manus_user_id", userId).limit(1).maybeSingle()) as { id: string } | null;
  if (!identity) throw new Error("Presentation identity could not be synchronized.");

  const linked = unwrap(await supabase.from("candidate_profiles").select("*").eq("placement_user_id", identity.id).limit(1).maybeSingle()) as CandidateProfile | null;
  if (linked) return candidateDto(linked);

  const existingDemo = unwrap(await supabase.from("candidate_profiles").select("*").eq("student_code", "DEMO-2026").limit(1).maybeSingle()) as CandidateProfile | null;
  if (existingDemo) {
    const updated = unwrap(await supabase.from("candidate_profiles").update({ placement_user_id: identity.id, email: "test+candidate@presentation.local", updated_at: new Date().toISOString() }).eq("id", existingDemo.id).select("*").single()) as CandidateProfile;
    return candidateDto(updated);
  }

  const created = unwrap(await supabase.from("candidate_profiles").insert({
    placement_user_id: identity.id,
    student_code: "DEMO-2026",
    full_name: "Presentation Candidate",
    email: "test+candidate@presentation.local",
    batch: "2026",
    department: "Computer Science",
    cgpa: 8.4,
    backlogs: 0,
    skills: ["React", "JavaScript", "CSS", "Figma", "SQL"],
    projects: ["Placement companion"],
    certifications: ["SQL Fundamentals"],
    profile_completion: 84,
    placement_status: "interviewing",
  }).select("*").single()) as CandidateProfile;
  return candidateDto(created);
}

export async function listSavedDriveIds(userId: number) {
  const profile = await getCandidateProfileForUser(userId);
  if (!profile) return [];
  const rows = unwrap(await supabase.from("candidate_saved_drives").select("placement_drive_id").eq("candidate_profile_id", profile.id).order("created_at", { ascending: false })) as Array<{ placement_drive_id: string }>;
  return rows.map((row) => row.placement_drive_id);
}

export async function setSavedDrive(userId: number, driveId: string, saved: boolean) {
  const profile = await getCandidateProfileForUser(userId);
  if (!profile) throw new Error("Candidate profile is not linked to the authenticated user.");
  if (saved) {
    unwrap(await supabase.from("candidate_saved_drives").upsert({ candidate_profile_id: profile.id, placement_drive_id: driveId }, { onConflict: "candidate_profile_id,placement_drive_id" }));
  } else {
    unwrap(await supabase.from("candidate_saved_drives").delete().eq("candidate_profile_id", profile.id).eq("placement_drive_id", driveId));
  }
  return { success: true, saved } as const;
}

export async function applyCandidateToDrive(userId: number, driveId: string) {
  const profile = await getCandidateProfileForUser(userId);
  if (!profile) throw new Error("Candidate profile is not linked to the authenticated user.");
  const existing = unwrap(await supabase.from("applications").select("*").eq("candidate_profile_id", profile.id).eq("placement_drive_id", driveId).limit(1).maybeSingle()) as Application | null;
  if (existing) return applicationDto(existing);
  const drive = unwrap(await supabase.from("placement_drives").select("id").eq("id", driveId).eq("published", true).limit(1).maybeSingle()) as { id: string } | null;
  if (!drive) throw new Error("Published placement drive was not found.");
  const created = unwrap(await supabase.from("applications").insert({ candidate_profile_id: profile.id, placement_drive_id: driveId, status: "submitted", eligibility_status: "review", match_score: 0, skill_gaps: [] }).select("*").single()) as Application;
  return applicationDto(created);
}

export async function getPlacementDriveByTitle(title: string) {
  const drive = unwrap(await supabase.from("placement_drives").select("*").eq("title", title).limit(1).maybeSingle()) as PlacementDrive | null;
  if (drive) return driveDto(drive);
  const demoDrive = presentationDemoDrives.find((row) => row.title === title);
  return demoDrive ? driveDto(demoDrive) : undefined;
}

export async function getPlacementSnapshot(useDemoFallback = false) {
  const [candidateResult, driveResult, applicationResult, interviewResult] = await Promise.all([
    supabase.from("candidate_profiles").select("*").order("updated_at", { ascending: false }),
    supabase.from("placement_drives").select("*").order("deadline", { ascending: false }),
    supabase.from("applications").select("*").order("updated_at", { ascending: false }),
    supabase.from("interviews").select("*").order("scheduled_at", { ascending: false }),
  ]);
  const candidates = (unwrap(candidateResult) as CandidateProfile[]).map(candidateDto);
  const drives = (unwrap(driveResult) as PlacementDrive[]).map(driveDto);
  const applications = (unwrap(applicationResult) as Application[]).map(applicationDto);
  const interviews = (unwrap(interviewResult) as Interview[]).map(interviewDto);
  if (useDemoFallback) {
    return {
      candidates: candidates.length ? candidates : [candidateDto(presentationDemoProfile)],
      drives: drives.length ? drives : presentationDemoDrives.map(driveDto),
      applications: applications.length ? applications : presentationDemoApplications.map(applicationDto),
      interviews,
    };
  }
  return { candidates, drives, applications, interviews };
}

export async function listNotificationsForUser(userId: number) {
  if (userId === -1001 || userId === -1002) return [];
  const identity = unwrap(await supabase.from("placement_users").select("id").eq("manus_user_id", userId).limit(1).maybeSingle()) as { id: string } | null;
  if (!identity) return [];
  const rows = unwrap(await supabase.from("notifications").select("*").eq("placement_user_id", identity.id).order("created_at", { ascending: false })) as Array<{ id: string; title: string; body: string; kind: string; created_at: string }>;
  return rows.map((row) => ({ id: row.id, title: row.title, body: row.body, kind: row.kind, createdAt: new Date(row.created_at) }));
}

export async function listRecruiterCandidates() {
  const result = unwrap(await supabase.from("applications").select("*, candidate:candidate_profiles(*), drive:placement_drives(*)"));
  return (result as Array<{ candidate: CandidateProfile; drive: PlacementDrive } & Application>).map((row) => ({ candidate: candidateDto(row.candidate), drive: driveDto(row.drive), application: applicationDto(row) }));
}

export async function listPlacementDrives() {
  const rows = unwrap(await supabase.from("placement_drives").select("*").order("deadline", { ascending: true })) as PlacementDrive[];
  return rows.map(driveDto);
}

export async function listRecruiterSchedule() {
  const result = unwrap(await supabase.from("interviews").select("*, application:applications(*, candidate:candidate_profiles(*), drive:placement_drives(*)), panel:interview_panels(*), room:interview_rooms(*)").order("scheduled_at", { ascending: true }));
  return (result as Array<Interview & { application: Application & { candidate: CandidateProfile; drive: PlacementDrive }; panel: { id: string; title: string; members: string[] } | null; room: { id: string; name: string; capacity: number } | null }>).map((row) => ({
    interview: interviewDto(row),
    application: applicationDto(row.application),
    candidate: candidateDto(row.application.candidate),
    drive: driveDto(row.application.drive),
    panel: row.panel ? { id: row.panel.id, title: row.panel.title, members: row.panel.members } : null,
    room: row.room ? { id: row.room.id, name: row.room.name, capacity: row.room.capacity } : null,
  }));
}

export async function updatePlacementApplicationStatus(applicationId: string, status: Application["status"]) {
  unwrap(await supabase.from("applications").update({ status, updated_at: new Date().toISOString() }).eq("id", applicationId));
  return { success: true } as const;
}

export async function verifyPlacementApplication(candidateProfileId: string, driveId: string) {
  const row = unwrap(await supabase.from("applications").select("*").eq("candidate_profile_id", candidateProfileId).eq("placement_drive_id", driveId).limit(1).maybeSingle()) as Application | null;
  return row ? applicationDto(row) : null;
}
