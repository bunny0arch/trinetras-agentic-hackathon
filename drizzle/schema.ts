import {
  decimal,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  placementRole: mysqlEnum("placementRole", ["candidate", "recruiter"])
    .default("candidate")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const candidateProfiles = mysqlTable("candidate_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  studentCode: varchar("studentCode", { length: 64 }).notNull().unique(),
  fullName: varchar("fullName", { length: 160 }).notNull(),
  email: varchar("email", { length: 320 }),
  batch: varchar("batch", { length: 16 }).notNull(),
  department: varchar("department", { length: 100 }).notNull(),
  cgpa: decimal("cgpa", { precision: 4, scale: 2 }).notNull(),
  backlogs: int("backlogs").default(0).notNull(),
  skills: json("skills").$type<string[]>().notNull(),
  projects: json("projects").$type<string[]>().notNull(),
  certifications: json("certifications").$type<string[]>().notNull(),
  resumeUrl: text("resumeUrl"),
  profileCompletion: int("profileCompletion").default(84).notNull(),
  placementStatus: mysqlEnum("placementStatus", ["searching", "interviewing", "placed"])
    .default("searching")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const placementDrives = mysqlTable("placement_drives", {
  id: int("id").autoincrement().primaryKey(),
  company: varchar("company", { length: 160 }).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  location: varchar("location", { length: 160 }).notNull(),
  packageLpa: decimal("packageLpa", { precision: 6, scale: 2 }).notNull(),
  deadline: timestamp("deadline").notNull(),
  minCgpa: decimal("minCgpa", { precision: 4, scale: 2 }).notNull(),
  maxBacklogs: int("maxBacklogs").default(0).notNull(),
  graduationBatch: varchar("graduationBatch", { length: 16 }).notNull(),
  allowedDepartments: json("allowedDepartments").$type<string[]>().notNull(),
  requiredSkills: json("requiredSkills").$type<string[]>().notNull(),
  published: int("published").default(1).notNull(),
  createdByUserId: int("createdByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const applications = mysqlTable("applications", {
  id: int("id").autoincrement().primaryKey(),
  candidateProfileId: int("candidateProfileId")
    .notNull()
    .references(() => candidateProfiles.id),
  placementDriveId: int("placementDriveId")
    .notNull()
    .references(() => placementDrives.id),
  status: mysqlEnum("status", ["submitted", "shortlisted", "assessment_pending", "interviewing", "rejected", "offered"])
    .default("submitted")
    .notNull(),
  eligibilityStatus: mysqlEnum("eligibilityStatus", ["eligible", "review", "ineligible"])
    .default("review")
    .notNull(),
  matchScore: int("matchScore").default(0).notNull(),
  eligibilityExplanation: text("eligibilityExplanation"),
  skillGaps: json("skillGaps").$type<string[]>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const interviewPanels = mysqlTable("interview_panels", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 160 }).notNull(),
  members: json("members").$type<string[]>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const interviewRooms = mysqlTable("interview_rooms", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull().unique(),
  capacity: int("capacity").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const interviews = mysqlTable("interviews", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId")
    .notNull()
    .references(() => applications.id),
  panelId: int("panelId").references(() => interviewPanels.id),
  roomId: int("roomId").references(() => interviewRooms.id),
  scheduledAt: timestamp("scheduledAt").notNull(),
  durationMinutes: int("durationMinutes").default(30).notNull(),
  mode: mysqlEnum("mode", ["video", "in_person"]).default("video").notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "completed", "rescheduled"])
    .default("pending")
    .notNull(),
  outcome: mysqlEnum("outcome", ["advance", "hold", "reject"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 180 }).notNull(),
  body: text("body").notNull(),
  kind: mysqlEnum("kind", ["drive", "application", "schedule", "reminder", "system"])
    .default("system")
    .notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type CandidateProfile = typeof candidateProfiles.$inferSelect;
export type PlacementDrive = typeof placementDrives.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type Interview = typeof interviews.$inferSelect;
