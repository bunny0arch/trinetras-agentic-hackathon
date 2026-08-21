CREATE TABLE `applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateProfileId` int NOT NULL,
	`placementDriveId` int NOT NULL,
	`status` enum('submitted','shortlisted','assessment_pending','interviewing','rejected','offered') NOT NULL DEFAULT 'submitted',
	`eligibilityStatus` enum('eligible','review','ineligible') NOT NULL DEFAULT 'review',
	`matchScore` int NOT NULL DEFAULT 0,
	`eligibilityExplanation` text,
	`skillGaps` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `candidate_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`studentCode` varchar(64) NOT NULL,
	`fullName` varchar(160) NOT NULL,
	`email` varchar(320),
	`batch` varchar(16) NOT NULL,
	`department` varchar(100) NOT NULL,
	`cgpa` decimal(4,2) NOT NULL,
	`backlogs` int NOT NULL DEFAULT 0,
	`skills` json NOT NULL,
	`projects` json NOT NULL,
	`certifications` json NOT NULL,
	`resumeUrl` text,
	`profileCompletion` int NOT NULL DEFAULT 84,
	`placementStatus` enum('searching','interviewing','placed') NOT NULL DEFAULT 'searching',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `candidate_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `candidate_profiles_studentCode_unique` UNIQUE(`studentCode`)
);
--> statement-breakpoint
CREATE TABLE `interview_panels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(160) NOT NULL,
	`members` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `interview_panels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interview_rooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`capacity` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `interview_rooms_id` PRIMARY KEY(`id`),
	CONSTRAINT `interview_rooms_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `interviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`panelId` int,
	`roomId` int,
	`scheduledAt` timestamp NOT NULL,
	`durationMinutes` int NOT NULL DEFAULT 30,
	`mode` enum('video','in_person') NOT NULL DEFAULT 'video',
	`status` enum('pending','confirmed','completed','rescheduled') NOT NULL DEFAULT 'pending',
	`outcome` enum('advance','hold','reject'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `interviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`body` text NOT NULL,
	`kind` enum('drive','application','schedule','reminder','system') NOT NULL DEFAULT 'system',
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `placement_drives` (
	`id` int AUTO_INCREMENT NOT NULL,
	`company` varchar(160) NOT NULL,
	`title` varchar(160) NOT NULL,
	`location` varchar(160) NOT NULL,
	`packageLpa` decimal(6,2) NOT NULL,
	`deadline` timestamp NOT NULL,
	`minCgpa` decimal(4,2) NOT NULL,
	`maxBacklogs` int NOT NULL DEFAULT 0,
	`graduationBatch` varchar(16) NOT NULL,
	`allowedDepartments` json NOT NULL,
	`requiredSkills` json NOT NULL,
	`published` int NOT NULL DEFAULT 1,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `placement_drives_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `placementRole` enum('candidate','recruiter') DEFAULT 'candidate' NOT NULL;--> statement-breakpoint
ALTER TABLE `applications` ADD CONSTRAINT `applications_candidateProfileId_candidate_profiles_id_fk` FOREIGN KEY (`candidateProfileId`) REFERENCES `candidate_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `applications` ADD CONSTRAINT `applications_placementDriveId_placement_drives_id_fk` FOREIGN KEY (`placementDriveId`) REFERENCES `placement_drives`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `candidate_profiles` ADD CONSTRAINT `candidate_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interviews` ADD CONSTRAINT `interviews_applicationId_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interviews` ADD CONSTRAINT `interviews_panelId_interview_panels_id_fk` FOREIGN KEY (`panelId`) REFERENCES `interview_panels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interviews` ADD CONSTRAINT `interviews_roomId_interview_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `interview_rooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `placement_drives` ADD CONSTRAINT `placement_drives_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;