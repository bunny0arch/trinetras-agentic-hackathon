create table if not exists public.placement_users (
  id uuid primary key default gen_random_uuid(),
  manus_user_id bigint not null unique,
  open_id text not null unique,
  name text,
  email text,
  placement_role text not null check (placement_role in ('candidate', 'recruiter')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.candidate_profiles (
  id uuid primary key default gen_random_uuid(),
  placement_user_id uuid unique references public.placement_users(id) on delete set null,
  student_code text not null unique,
  full_name text not null,
  email text,
  batch text not null,
  department text not null,
  cgpa numeric(4,2) not null check (cgpa between 0 and 10),
  backlogs integer not null default 0 check (backlogs >= 0),
  skills jsonb not null default '[]'::jsonb,
  projects jsonb not null default '[]'::jsonb,
  certifications jsonb not null default '[]'::jsonb,
  resume_url text,
  profile_completion integer not null default 84 check (profile_completion between 0 and 100),
  placement_status text not null default 'searching' check (placement_status in ('searching', 'interviewing', 'placed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.placement_drives (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  title text not null,
  location text not null,
  package_lpa numeric(6,2) not null,
  deadline timestamptz not null,
  min_cgpa numeric(4,2) not null check (min_cgpa between 0 and 10),
  max_backlogs integer not null default 0 check (max_backlogs >= 0),
  graduation_batch text not null,
  allowed_departments jsonb not null default '[]'::jsonb,
  required_skills jsonb not null default '[]'::jsonb,
  published boolean not null default true,
  created_by_user_id uuid references public.placement_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company, title)
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  candidate_profile_id uuid not null references public.candidate_profiles(id) on delete cascade,
  placement_drive_id uuid not null references public.placement_drives(id) on delete cascade,
  status text not null default 'submitted' check (status in ('submitted', 'shortlisted', 'assessment_pending', 'interviewing', 'rejected', 'offered')),
  eligibility_status text not null default 'review' check (eligibility_status in ('eligible', 'review', 'ineligible')),
  match_score integer not null default 0 check (match_score between 0 and 100),
  eligibility_explanation text,
  skill_gaps jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (candidate_profile_id, placement_drive_id)
);

create table if not exists public.interview_panels (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  members jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.interview_rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  capacity integer not null check (capacity > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  panel_id uuid references public.interview_panels(id) on delete set null,
  room_id uuid references public.interview_rooms(id) on delete set null,
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 30 check (duration_minutes > 0),
  mode text not null default 'video' check (mode in ('video', 'in_person')),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'rescheduled')),
  outcome text check (outcome in ('advance', 'hold', 'reject')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  placement_user_id uuid not null references public.placement_users(id) on delete cascade,
  title text not null,
  body text not null,
  kind text not null default 'system' check (kind in ('drive', 'application', 'schedule', 'reminder', 'system')),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists applications_drive_idx on public.applications(placement_drive_id);
create index if not exists applications_candidate_idx on public.applications(candidate_profile_id);
create index if not exists interviews_scheduled_idx on public.interviews(scheduled_at);
create index if not exists drives_published_deadline_idx on public.placement_drives(published, deadline);

alter table public.placement_users enable row level security;
alter table public.candidate_profiles enable row level security;
alter table public.placement_drives enable row level security;
alter table public.applications enable row level security;
alter table public.interview_panels enable row level security;
alter table public.interview_rooms enable row level security;
alter table public.interviews enable row level security;
alter table public.notifications enable row level security;

insert into public.placement_drives (company, title, location, package_lpa, deadline, min_cgpa, max_backlogs, graduation_batch, allowed_departments, required_skills, published)
values
  ('Northstar Labs', 'Product Design Intern', 'Bengaluru · Hybrid', 12.00, '2026-08-24T18:30:00Z', 7.00, 0, '2026', '["Design", "Computer Science", "Information Technology"]'::jsonb, '["Figma", "User research", "Prototyping"]'::jsonb, true),
  ('Vertex Systems', 'Frontend Engineer', 'Remote · India', 16.00, '2026-08-27T18:30:00Z', 7.50, 0, '2026', '["Computer Science", "Information Technology"]'::jsonb, '["React", "JavaScript", "CSS"]'::jsonb, true),
  ('Mosaic Finance', 'Data Analyst', 'Mumbai · On-site', 10.00, '2026-08-30T18:30:00Z', 7.00, 1, '2026', '["Computer Science", "Information Technology", "Economics", "Mathematics"]'::jsonb, '["SQL", "Excel", "Python", "Statistics"]'::jsonb, true)
on conflict (company, title) do update set
  location = excluded.location,
  package_lpa = excluded.package_lpa,
  deadline = excluded.deadline,
  min_cgpa = excluded.min_cgpa,
  max_backlogs = excluded.max_backlogs,
  graduation_batch = excluded.graduation_batch,
  allowed_departments = excluded.allowed_departments,
  required_skills = excluded.required_skills,
  published = excluded.published,
  updated_at = now();

insert into public.candidate_profiles (student_code, full_name, email, batch, department, cgpa, backlogs, skills, projects, certifications, profile_completion, placement_status)
values ('AARAV-2026', 'Aarav Rao', 'aarav.rao@example.edu', '2026', 'Computer Science', 8.40, 0, '["React", "JavaScript", "CSS", "Figma", "User research", "Prototyping", "SQL", "Excel"]'::jsonb, '["Placement companion", "Accessible campus events"]'::jsonb, '["Google UX Design", "SQL Fundamentals"]'::jsonb, 84, 'interviewing')
on conflict (student_code) do update set
  full_name = excluded.full_name,
  email = excluded.email,
  batch = excluded.batch,
  department = excluded.department,
  cgpa = excluded.cgpa,
  backlogs = excluded.backlogs,
  skills = excluded.skills,
  projects = excluded.projects,
  certifications = excluded.certifications,
  profile_completion = excluded.profile_completion,
  placement_status = excluded.placement_status,
  updated_at = now();

insert into public.applications (candidate_profile_id, placement_drive_id, status, eligibility_status, match_score, eligibility_explanation, skill_gaps)
select candidate.id, drive.id,
  case drive.title when 'Product Design Intern' then 'shortlisted' when 'Frontend Engineer' then 'assessment_pending' else 'submitted' end,
  case drive.title when 'Data Analyst' then 'review' else 'eligible' end,
  case drive.title when 'Product Design Intern' then 94 when 'Frontend Engineer' then 87 else 61 end,
  'Seeded placement eligibility record.',
  case drive.title when 'Product Design Intern' then '["Design systems"]'::jsonb when 'Frontend Engineer' then '["Testing fundamentals"]'::jsonb else '["Python", "Statistics"]'::jsonb end
from public.candidate_profiles candidate
cross join public.placement_drives drive
where candidate.student_code = 'AARAV-2026'
  and drive.company in ('Northstar Labs', 'Vertex Systems', 'Mosaic Finance')
on conflict (candidate_profile_id, placement_drive_id) do update set
  status = excluded.status,
  eligibility_status = excluded.eligibility_status,
  match_score = excluded.match_score,
  eligibility_explanation = excluded.eligibility_explanation,
  skill_gaps = excluded.skill_gaps,
  updated_at = now();

insert into public.interview_panels (title, members)
values ('Product Design Panel', '["Priya Menon", "Arjun Shah"]'::jsonb)
on conflict (title) do update set members = excluded.members;

insert into public.interview_rooms (name, capacity)
values ('Video Room A', 6)
on conflict (name) do update set capacity = excluded.capacity;

insert into public.interviews (application_id, panel_id, room_id, scheduled_at, duration_minutes, mode, status)
select application.id, panel.id, room.id, '2026-08-22T05:00:00Z', 45, 'video', 'confirmed'
from public.applications application
join public.candidate_profiles candidate on candidate.id = application.candidate_profile_id
join public.placement_drives drive on drive.id = application.placement_drive_id
join public.interview_panels panel on panel.title = 'Product Design Panel'
join public.interview_rooms room on room.name = 'Video Room A'
where candidate.student_code = 'AARAV-2026' and drive.title = 'Product Design Intern'
  and not exists (select 1 from public.interviews existing where existing.application_id = application.id);
