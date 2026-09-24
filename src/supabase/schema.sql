-- ==========================================================
-- EATM CampusConnect - Complete PostgreSQL Database Schema & Hardened Security Architecture
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
-- ==========================================================

-- 1. Create Storage Bucket for Campus Uploads
insert into storage.buckets (id, name, public)
values ('campus-uploads', 'campus-uploads', true)
on conflict (id) do update set public = true;

-- Drop previous storage policies if they exist
drop policy if exists "Public Access to campus-uploads" on storage.objects;
drop policy if exists "Allow Uploads to campus-uploads" on storage.objects;
drop policy if exists "Allow all operations on campus-uploads" on storage.objects;
drop policy if exists "Allow Authenticated Uploads" on storage.objects;
drop policy if exists "Allow Authenticated Updates" on storage.objects;
drop policy if exists "Allow Authenticated Deletions" on storage.objects;

-- Secure Storage Policies for campus-uploads bucket
create policy "Allow Public Read on campus-uploads"
on storage.objects for select
using (bucket_id = 'campus-uploads');

create policy "Allow Authenticated Uploads to campus-uploads"
on storage.objects for insert
with check (
  bucket_id = 'campus-uploads' 
  and auth.role() = 'authenticated'
);

create policy "Allow Authenticated Updates on campus-uploads"
on storage.objects for update
using (
  bucket_id = 'campus-uploads' 
  and auth.role() = 'authenticated'
)
with check (
  bucket_id = 'campus-uploads' 
  and auth.role() = 'authenticated'
);

create policy "Allow Authenticated Deletions on campus-uploads"
on storage.objects for delete
using (
  bucket_id = 'campus-uploads' 
  and auth.role() = 'authenticated'
);

-- ==========================================================
-- 2. Core Campus Tables
-- ==========================================================

-- 2.1 Users Table
create table if not exists public.users (
  id text primary key,
  uid text,
  email text not null,
  "displayName" text not null,
  role text not null default 'student', -- 'student' | 'faculty' | 'admin'
  department text,
  year text,
  semester text,
  "rollNumber" text,
  "employeeId" text,
  designation text,
  phone text,
  "photoURL" text,
  "coverURL" text,
  bio text,
  skills text[] default '{}',
  interests text[] default '{}',
  stats jsonb default '{"connections": 0, "posts": 0, "clubs": 0, "achievements": 0}',
  projects jsonb default '[]',
  achievements jsonb default '[]',
  "socialLinks" jsonb default '{}',
  settings jsonb default '{}',
  status text default 'active',
  verified boolean default false,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

-- Ensure all users columns exist if table pre-existed
alter table public.users add column if not exists uid text;
alter table public.users add column if not exists email text;
alter table public.users add column if not exists "displayName" text;
alter table public.users add column if not exists role text default 'student';
alter table public.users add column if not exists department text;
alter table public.users add column if not exists year text;
alter table public.users add column if not exists semester text;
alter table public.users add column if not exists "rollNumber" text;
alter table public.users add column if not exists "employeeId" text;
alter table public.users add column if not exists designation text;
alter table public.users add column if not exists phone text;
alter table public.users add column if not exists "photoURL" text;
alter table public.users add column if not exists "coverURL" text;
alter table public.users add column if not exists bio text;
alter table public.users add column if not exists skills text[] default '{}';
alter table public.users add column if not exists interests text[] default '{}';
alter table public.users add column if not exists stats jsonb default '{"connections": 0, "posts": 0, "clubs": 0, "achievements": 0}';
alter table public.users add column if not exists projects jsonb default '[]';
alter table public.users add column if not exists achievements jsonb default '[]';
alter table public.users add column if not exists "socialLinks" jsonb default '{}';
alter table public.users add column if not exists settings jsonb default '{}';
alter table public.users add column if not exists status text default 'active';
alter table public.users add column if not exists verified boolean default false;
alter table public.users add column if not exists "createdAt" timestamptz default now();
alter table public.users add column if not exists "updatedAt" timestamptz default now();

-- Ensure standard seed users exist in public.users
insert into public.users (id, uid, email, "displayName", role, department, year, semester, "rollNumber", "employeeId", designation, phone, "photoURL", "coverURL", bio, skills, interests, status, verified)
values
  ('user_soumya', 'user_soumya', 'soumya.sahoo@eatm.in', 'Soumyaranjan Sahoo', 'student', 'CSE', '3rd Year', '6th', 'EATM23CSE001', null, null, '+91 98765 43210', null, 'https://images.unsplash.com/photo-1562774053-701939374585?w=1600&auto=format&fit=crop&q=80', 'Passionate about building innovative solutions and love to learn new technologies. EATM Hackathon 2024 Winner.', array['C++', 'Java', 'Python', 'React', 'Web Dev', 'UI/UX', 'Node.js'], array['Coding', 'Gaming', 'Photography', 'Robotics'], 'active', true),
  ('user_priya', 'user_priya', 'priya.sharma@eatm.in', 'Priya Sharma', 'student', 'CSE', '3rd Year', '6th', 'EATM23CSE015', null, null, null, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&auto=format&fit=crop&q=80', 'Frontend enthusiast | UI/UX Designer | EATM Coding Club Lead Organizer', array['React', 'UI/UX', 'Python', 'Tailwind', 'Figma', 'TypeScript'], array['Design', 'Hackathons', 'Music'], 'active', true),
  ('user_rohit', 'user_rohit', 'rohit.kumar@eatm.in', 'Rohit Kumar', 'student', 'ECE', '3rd Year', '6th', 'EATM23ECE044', null, null, null, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80', null, 'Embedded systems engineer & Machine Learning researcher. Robotics Club Vice-President.', array['Python', 'ML', 'Data Science', 'Embedded C', 'Arduino'], array['Robotics', 'Circuits', 'Cricket'], 'active', true),
  ('user_ananya', 'user_ananya', 'ananya.das@eatm.in', 'Ananya Das', 'student', 'CSE', '2nd Year', '4th', 'EATM24CSE089', null, null, null, 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80', null, 'Exploring full-stack web dev & DSA. Always curious to learn and build together.', array['Web Dev', 'MERN', 'DSA', 'JavaScript'], array['Reading', 'Web Development'], 'active', true),
  ('user_arjun', 'user_arjun', 'arjun.mehta@eatm.in', 'Arjun Mehta', 'student', 'Mechanical', '3rd Year', '6th', 'EATM23ME012', null, null, null, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80', null, 'Mechanical design passionate. Formula Student vehicle designer & 3D CAD modeling fanatic.', array['CAD', 'SolidWorks', 'Design', 'Ansys'], array['Automobiles', 'Aviation'], 'active', true),
  ('user_rakesh', 'user_rakesh', 'rakesh.kumar@eatm.in', 'Rakesh Kumar', 'student', 'CSE', '3rd Year', '6th', 'EATM23CSE052', null, null, null, 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80', null, 'Full-stack developer | Cloud enthusiast | Proud EATMian 🚀', array['React', 'Node.js', 'Docker', 'AWS'], array['Hackathons', 'Cloud'], 'active', true),
  ('faculty_mohapatra', 'faculty_mohapatra', 'hod.cse@eatm.in', 'Dr. B. K. Mohapatra', 'faculty', 'CSE', null, null, null, 'EATM-FAC-101', 'Professor & Head of Department', '+91 94371 00223', 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80', null, 'Ph.D. in Computer Science & Engineering. 22+ years of research and teaching experience in AI, Cloud, and Distributed Systems.', array['Machine Learning', 'AI', 'Distributed Systems'], array['Mentorship', 'Research'], 'active', true),
  ('admin_rath', 'admin_rath', 'admin.dean@eatm.in', 'Prof. S. K. Rath (Dean Affairs)', 'admin', 'Administration', null, null, null, 'EATM-ADM-001', 'Dean of Student Affairs & Campus Operations', '+91 94370 11990', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80', null, 'Overseeing campus community development, academic discipline, and student life initiatives at EATM.', array['Governance', 'Policy', 'Student Development'], array['Leadership', 'Community'], 'active', true)
on conflict (id) do update set
  uid = excluded.uid,
  email = excluded.email,
  "displayName" = excluded."displayName",
  role = excluded.role,
  department = excluded.department,
  status = excluded.status,
  verified = excluded.verified;

-- 2.2 Posts Table
create table if not exists public.posts (
  id text primary key,
  "authorId" text not null references public.users(id) on delete cascade,
  "authorName" text not null,
  "authorAvatar" text,
  "authorRole" text not null default 'student',
  "authorDept" text,
  content text not null,
  "mediaUrl" text,
  "mediaUrls" text[] default '{}',
  "mediaType" text,
  feeling text,
  poll jsonb,
  visibility text default 'campus',
  likes text[] default '{}',
  "likesCount" int default 0,
  "commentsCount" int default 0,
  "sharesCount" int default 0,
  "savedBy" text[] default '{}',
  "createdAt" timestamptz default now()
);

-- Ensure mediaUrls column exists
alter table public.posts add column if not exists "mediaUrls" text[] default '{}';

-- 2.3 Comments Table
create table if not exists public.comments (
  id text primary key,
  "postId" text not null references public.posts(id) on delete cascade,
  "authorId" text not null references public.users(id) on delete cascade,
  "authorName" text not null,
  "authorAvatar" text,
  content text not null,
  "createdAt" timestamptz default now()
);

-- ==========================================================
-- 3. Communities / Clubs & Student Societies Tables
-- ==========================================================

-- 3.1 Communities Table
create table if not exists public.communities (
  id text primary key,
  name text not null,
  description text not null,
  category text not null,
  type text not null default 'public', -- 'public' | 'private'
  logo text,
  "logoUrl" text,
  cover text,
  "coverUrl" text,
  "ownerId" text references public.users(id) on delete set null,
  "isOfficial" boolean default false,
  "verificationStatus" text default 'student', -- 'verified' | 'student' | 'pending'
  lead text,
  "leadRole" text,
  "memberCount" int default 1,
  members text[] default '{}',
  admins text[] default '{}',
  moderators text[] default '{}',
  "pendingRequests" text[] default '{}',
  "bannedUsers" text[] default '{}',
  rules text[] default '{}',
  tags text[] default '{}',
  "meetingTime" text,
  room text,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

-- Ensure all community columns exist if table pre-existed
alter table public.communities add column if not exists name text;
alter table public.communities add column if not exists description text;
alter table public.communities add column if not exists category text;
alter table public.communities add column if not exists type text default 'public';
alter table public.communities add column if not exists logo text;
alter table public.communities add column if not exists "logoUrl" text;
alter table public.communities add column if not exists cover text;
alter table public.communities add column if not exists "coverUrl" text;
alter table public.communities add column if not exists "ownerId" text;
alter table public.communities add column if not exists "isOfficial" boolean default false;
alter table public.communities add column if not exists "verificationStatus" text default 'student';
alter table public.communities add column if not exists lead text;
alter table public.communities add column if not exists "leadRole" text;
alter table public.communities add column if not exists "memberCount" int default 1;
alter table public.communities add column if not exists members text[] default '{}';
alter table public.communities add column if not exists admins text[] default '{}';
alter table public.communities add column if not exists moderators text[] default '{}';
alter table public.communities add column if not exists "pendingRequests" text[] default '{}';
alter table public.communities add column if not exists "bannedUsers" text[] default '{}';
alter table public.communities add column if not exists rules text[] default '{}';
alter table public.communities add column if not exists tags text[] default '{}';
alter table public.communities add column if not exists "meetingTime" text;
alter table public.communities add column if not exists room text;
alter table public.communities add column if not exists "createdAt" timestamptz default now();
alter table public.communities add column if not exists "updatedAt" timestamptz default now();

-- 3.2 Community Memberships Table (Single Source of Truth)
create table if not exists public.community_members (
  id text primary key,
  "communityId" text not null references public.communities(id) on delete cascade,
  "userId" text not null references public.users(id) on delete cascade,
  role text not null default 'member', -- 'owner' | 'admin' | 'moderator' | 'member'
  status text not null default 'approved', -- 'approved' | 'pending' | 'rejected' | 'banned'
  "requestedAt" timestamptz,
  "joinedAt" timestamptz default now(),
  "updatedAt" timestamptz default now(),
  unique("communityId", "userId")
);

alter table public.community_members add column if not exists "communityId" text;
alter table public.community_members add column if not exists "userId" text;
alter table public.community_members add column if not exists role text default 'member';
alter table public.community_members add column if not exists status text default 'approved';
alter table public.community_members add column if not exists "requestedAt" timestamptz;
alter table public.community_members add column if not exists "joinedAt" timestamptz default now();
alter table public.community_members add column if not exists "updatedAt" timestamptz default now();

-- Ensure seed communities exist
insert into public.communities (id, name, description, category, type, logo, "logoUrl", cover, "coverUrl", "ownerId", "isOfficial", "verificationStatus", lead, "leadRole", "memberCount", members, admins, moderators, "pendingRequests", "bannedUsers", rules, tags)
values
  ('comm_coding', 'EATM Coding Club (ECC)', 'Official competitive programming, web development, open-source development, and hackathon training community of Einstein Academy of Technology & Management.', 'Technical', 'public', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=300&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=300&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80', 'user_soumya', true, 'verified', 'Soumyaranjan Sahoo', 'Lead Coordinator', 4, array['user_soumya', 'user_priya', 'user_rohit', 'user_ananya'], array['user_soumya', 'user_priya'], array['user_rohit'], array[]::text[], array[]::text[], array['Respect all members', 'Constructive code reviews only', 'No plagiarized contest solutions', 'Keep discussions tech & academic related'], array['Technical', 'Coding', 'WebDev', 'DSA', 'CompetitiveProgramming']),
  ('comm_robotics', 'Robotics & Automation Society (E-Robotics)', 'Hands-on IoT, embedded systems, microcontrollers, ROS, drone technology, and state-level robotics competition team.', 'Technical', 'public', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=300&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=300&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80', 'user_rohit', true, 'verified', 'Rohit Kumar', 'Society President', 3, array['user_rohit', 'user_soumya', 'user_arjun'], array['user_rohit'], array['user_soumya'], array[]::text[], array[]::text[], array['Handle Lab hardware with care', 'Return electronic components after sessions', 'Prioritize lab safety protocols at all times'], array['Robotics', 'IoT', 'Embedded Systems', 'Hardware', 'Automation']),
  ('comm_cultural', 'EATM Cultural & Arts Guild', 'Music, dance, theatre, fine arts, photography, stage anchoring, and annual college fest management society.', 'Cultural', 'public', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1469488865564-c2de10f69f96?w=1200&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1469488865564-c2de10f69f96?w=1200&auto=format&fit=crop&q=80', 'user_ananya', true, 'verified', 'Ananya Das', 'Secretary', 2, array['user_ananya', 'user_priya'], array['user_ananya'], array[]::text[], array[]::text[], array[]::text[], array['Punctuality in stage rehearsals', 'Respect all art forms & performers', 'Maintain studio cleanliness'], array['Cultural', 'Music', 'Drama', 'Dance', 'Arts', 'Fest']),
  ('comm_sports', 'EATM Sports Council & Athletics', 'Inter-college cricket, football, volleyball, badminton tournaments, and daily fitness sessions.', 'Sports', 'public', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=300&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=300&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&auto=format&fit=crop&q=80', 'user_arjun', true, 'verified', 'Arjun Mehta', 'Sports Captain', 2, array['user_arjun', 'user_rakesh'], array['user_arjun'], array[]::text[], array[]::text[], array[]::text[], array['Fair play and sportsmanship', 'Ground discipline is mandatory', 'Regular attendance for team drills'], array['Sports', 'Athletics', 'Cricket', 'Football', 'Badminton']),
  ('comm_entrepreneurship', 'E-Cell & Startup Incubation', 'Entrepreneurship cell fostering student startups, intellectual property, pitching competitions, and investor connects.', 'Entrepreneurship', 'public', 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=300&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=300&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200&auto=format&fit=crop&q=80', 'faculty_mohapatra', true, 'verified', 'Dr. B. K. Mohapatra', 'Faculty Advisor', 2, array['faculty_mohapatra', 'user_soumya'], array['faculty_mohapatra'], array['user_soumya'], array[]::text[], array[]::text[], array['Protect startup IP & confidentiality', 'Constructive feedback only', 'Meet incubation milestone deadlines'], array['Startups', 'Incubation', 'Entrepreneurship', 'VentureCapital', 'Patents']),
  ('comm_alumni', 'EATM Alumni Council & Career Network', 'Private network for verified alumni, final-year students, and faculty mentors for career mentoring, referrals, and off-campus drives.', 'Alumni', 'private', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=300&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=300&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&auto=format&fit=crop&q=80', 'admin_rath', true, 'verified', 'Prof. S. K. Rath', 'Dean Student Affairs', 3, array['admin_rath', 'faculty_mohapatra', 'user_soumya'], array['admin_rath', 'faculty_mohapatra'], array[], array['user_priya', 'user_rohit'], array[]::text[], array['Strict verification before joining', 'Confidential salary and referral discussion', 'No external recruiters without prior clearance'], array['Alumni', 'Career', 'Mentorship', 'Referrals', 'Networking'])
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  type = excluded.type,
  logo = excluded.logo,
  "logoUrl" = excluded."logoUrl",
  cover = excluded.cover,
  "coverUrl" = excluded."coverUrl",
  "ownerId" = excluded."ownerId",
  "isOfficial" = excluded."isOfficial",
  "verificationStatus" = excluded."verificationStatus",
  lead = excluded.lead,
  "leadRole" = excluded."leadRole",
  "memberCount" = excluded."memberCount",
  members = excluded.members,
  admins = excluded.admins,
  moderators = excluded.moderators,
  "pendingRequests" = excluded."pendingRequests",
  "bannedUsers" = excluded."bannedUsers",
  rules = excluded.rules,
  tags = excluded.tags;

-- Seed community members into community_members table
insert into public.community_members (id, "communityId", "userId", role, status)
values
  ('cm_comm_coding_user_soumya', 'comm_coding', 'user_soumya', 'owner', 'approved'),
  ('cm_comm_coding_user_priya', 'comm_coding', 'user_priya', 'admin', 'approved'),
  ('cm_comm_coding_user_rohit', 'comm_coding', 'user_rohit', 'moderator', 'approved'),
  ('cm_comm_coding_user_ananya', 'comm_coding', 'user_ananya', 'member', 'approved'),
  ('cm_comm_robotics_user_rohit', 'comm_robotics', 'user_rohit', 'owner', 'approved'),
  ('cm_comm_robotics_user_soumya', 'comm_robotics', 'user_soumya', 'moderator', 'approved'),
  ('cm_comm_robotics_user_arjun', 'comm_robotics', 'user_arjun', 'member', 'approved'),
  ('cm_comm_cultural_user_ananya', 'comm_cultural', 'user_ananya', 'owner', 'approved'),
  ('cm_comm_cultural_user_priya', 'comm_cultural', 'user_priya', 'member', 'approved'),
  ('cm_comm_sports_user_arjun', 'comm_sports', 'user_arjun', 'owner', 'approved'),
  ('cm_comm_sports_user_rakesh', 'comm_sports', 'user_rakesh', 'member', 'approved'),
  ('cm_comm_entrepreneurship_faculty_mohapatra', 'comm_entrepreneurship', 'faculty_mohapatra', 'owner', 'approved'),
  ('cm_comm_entrepreneurship_user_soumya', 'comm_entrepreneurship', 'user_soumya', 'moderator', 'approved'),
  ('cm_comm_alumni_admin_rath', 'comm_alumni', 'admin_rath', 'owner', 'approved'),
  ('cm_comm_alumni_faculty_mohapatra', 'comm_alumni', 'faculty_mohapatra', 'admin', 'approved'),
  ('cm_comm_alumni_user_soumya', 'comm_alumni', 'user_soumya', 'member', 'approved'),
  ('cm_comm_alumni_user_priya', 'comm_alumni', 'user_priya', 'member', 'pending'),
  ('cm_comm_alumni_user_rohit', 'comm_alumni', 'user_rohit', 'member', 'pending')
on conflict (id) do update set
  role = excluded.role,
  status = excluded.status;

-- 3.3 Community Posts Table
create table if not exists public.community_posts (
  id text primary key,
  "communityId" text not null references public.communities(id) on delete cascade,
  "authorId" text not null references public.users(id) on delete cascade,
  "authorName" text not null,
  "authorAvatar" text,
  "authorRole" text,
  "authorDept" text,
  content text not null,
  "postType" text not null default 'text', -- 'text' | 'image' | 'announcement' | 'question' | 'poll' | 'project'
  "mediaUrl" text,
  "mediaUrls" text[] default '{}',
  "isPinned" boolean default false,
  likes text[] default '{}',
  "likesCount" int default 0,
  "commentsCount" int default 0,
  poll jsonb,
  project jsonb,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

alter table public.community_posts add column if not exists "communityId" text;
alter table public.community_posts add column if not exists "authorId" text;
alter table public.community_posts add column if not exists "authorName" text;
alter table public.community_posts add column if not exists "authorAvatar" text;
alter table public.community_posts add column if not exists "authorRole" text;
alter table public.community_posts add column if not exists "authorDept" text;
alter table public.community_posts add column if not exists content text;
alter table public.community_posts add column if not exists "postType" text default 'text';
alter table public.community_posts add column if not exists "mediaUrl" text;
alter table public.community_posts add column if not exists "mediaUrls" text[] default '{}';
alter table public.community_posts add column if not exists "isPinned" boolean default false;
alter table public.community_posts add column if not exists likes text[] default '{}';
alter table public.community_posts add column if not exists "likesCount" int default 0;
alter table public.community_posts add column if not exists "commentsCount" int default 0;
alter table public.community_posts add column if not exists poll jsonb;
alter table public.community_posts add column if not exists project jsonb;
alter table public.community_posts add column if not exists "createdAt" timestamptz default now();
alter table public.community_posts add column if not exists "updatedAt" timestamptz default now();

-- 3.4 Community Comments Table
create table if not exists public.community_comments (
  id text primary key,
  "postId" text not null references public.community_posts(id) on delete cascade,
  "communityId" text not null references public.communities(id) on delete cascade,
  "authorId" text not null references public.users(id) on delete cascade,
  "authorName" text not null,
  "authorAvatar" text,
  "authorDept" text,
  content text not null,
  "parentCommentId" text,
  likes text[] default '{}',
  "createdAt" timestamptz default now()
);

alter table public.community_comments add column if not exists "postId" text;
alter table public.community_comments add column if not exists "communityId" text;
alter table public.community_comments add column if not exists "authorId" text;
alter table public.community_comments add column if not exists "authorName" text;
alter table public.community_comments add column if not exists "authorAvatar" text;
alter table public.community_comments add column if not exists "authorDept" text;
alter table public.community_comments add column if not exists content text;
alter table public.community_comments add column if not exists "parentCommentId" text;
alter table public.community_comments add column if not exists likes text[] default '{}';
alter table public.community_comments add column if not exists "createdAt" timestamptz default now();

-- 3.5 Community Discussions Table
create table if not exists public.community_discussions (
  id text primary key,
  "communityId" text not null references public.communities(id) on delete cascade,
  "authorId" text not null references public.users(id) on delete cascade,
  "authorName" text not null,
  "authorAvatar" text,
  "authorRole" text,
  "authorDept" text,
  title text not null,
  content text not null,
  category text not null default 'General', -- 'General' | 'Questions' | 'Projects' | 'Help' | 'Announcements'
  likes text[] default '{}',
  "likesCount" int default 0,
  "commentsCount" int default 0,
  "isPinned" boolean default false,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

alter table public.community_discussions add column if not exists "communityId" text;
alter table public.community_discussions add column if not exists "authorId" text;
alter table public.community_discussions add column if not exists "authorName" text;
alter table public.community_discussions add column if not exists "authorAvatar" text;
alter table public.community_discussions add column if not exists "authorRole" text;
alter table public.community_discussions add column if not exists "authorDept" text;
alter table public.community_discussions add column if not exists title text;
alter table public.community_discussions add column if not exists content text;
alter table public.community_discussions add column if not exists category text default 'General';
alter table public.community_discussions add column if not exists likes text[] default '{}';
alter table public.community_discussions add column if not exists "likesCount" int default 0;
alter table public.community_discussions add column if not exists "commentsCount" int default 0;
alter table public.community_discussions add column if not exists "isPinned" boolean default false;
alter table public.community_discussions add column if not exists "createdAt" timestamptz default now();
alter table public.community_discussions add column if not exists "updatedAt" timestamptz default now();

-- 3.6 Community Discussion Comments Table
create table if not exists public.community_discussion_comments (
  id text primary key,
  "discussionId" text not null references public.community_discussions(id) on delete cascade,
  "communityId" text not null references public.communities(id) on delete cascade,
  "authorId" text not null references public.users(id) on delete cascade,
  "authorName" text not null,
  "authorAvatar" text,
  content text not null,
  "createdAt" timestamptz default now()
);

alter table public.community_discussion_comments add column if not exists "discussionId" text;
alter table public.community_discussion_comments add column if not exists "communityId" text;
alter table public.community_discussion_comments add column if not exists "authorId" text;
alter table public.community_discussion_comments add column if not exists "authorName" text;
alter table public.community_discussion_comments add column if not exists "authorAvatar" text;
alter table public.community_discussion_comments add column if not exists content text;
alter table public.community_discussion_comments add column if not exists "createdAt" timestamptz default now();

-- 3.7 Community Live Messages Table (Group Chat)
create table if not exists public.community_messages (
  id text primary key,
  "communityId" text not null references public.communities(id) on delete cascade,
  "senderId" text not null references public.users(id) on delete cascade,
  "senderName" text not null,
  "senderAvatar" text,
  text text not null,
  "mediaUrl" text,
  "mediaType" text,
  "fileName" text,
  "fileSize" text,
  "replyTo" jsonb,
  reactions jsonb default '{}',
  "createdAt" timestamptz default now()
);

alter table public.community_messages add column if not exists "communityId" text;
alter table public.community_messages add column if not exists "senderId" text;
alter table public.community_messages add column if not exists "senderName" text;
alter table public.community_messages add column if not exists "senderAvatar" text;
alter table public.community_messages add column if not exists text text;
alter table public.community_messages add column if not exists "mediaUrl" text;
alter table public.community_messages add column if not exists "mediaType" text;
alter table public.community_messages add column if not exists "fileName" text;
alter table public.community_messages add column if not exists "fileSize" text;
alter table public.community_messages add column if not exists "replyTo" jsonb;
alter table public.community_messages add column if not exists reactions jsonb default '{}';
alter table public.community_messages add column if not exists "createdAt" timestamptz default now();

-- 3.8 Community Resources Table
create table if not exists public.community_resources (
  id text primary key,
  "communityId" text not null references public.communities(id) on delete cascade,
  title text not null,
  description text not null,
  "fileUrl" text not null,
  "fileType" text not null,
  "fileSize" text not null,
  "uploadedBy" text not null references public.users(id) on delete cascade,
  "uploadedByName" text not null,
  "uploadedByAvatar" text,
  "isMemberOnly" boolean default true,
  downloads int default 0,
  "createdAt" timestamptz default now()
);

alter table public.community_resources add column if not exists "communityId" text;
alter table public.community_resources add column if not exists title text;
alter table public.community_resources add column if not exists description text;
alter table public.community_resources add column if not exists "fileUrl" text;
alter table public.community_resources add column if not exists "fileType" text;
alter table public.community_resources add column if not exists "fileSize" text;
alter table public.community_resources add column if not exists "uploadedBy" text;
alter table public.community_resources add column if not exists "uploadedByName" text;
alter table public.community_resources add column if not exists "uploadedByAvatar" text;
alter table public.community_resources add column if not exists "isMemberOnly" boolean default true;
alter table public.community_resources add column if not exists downloads int default 0;
alter table public.community_resources add column if not exists "createdAt" timestamptz default now();

-- 3.9 Community Events Table
create table if not exists public.community_events (
  id text primary key,
  "communityId" text not null references public.communities(id) on delete cascade,
  title text not null,
  description text not null,
  date text not null,
  time text not null,
  location text not null,
  "isOnline" boolean default false,
  "meetingLink" text,
  category text not null default 'Workshop',
  "createdBy" text not null references public.users(id) on delete cascade,
  "attendeesCount" int default 0,
  attendees jsonb default '[]',
  "createdAt" timestamptz default now()
);

alter table public.community_events add column if not exists "communityId" text;
alter table public.community_events add column if not exists title text;
alter table public.community_events add column if not exists description text;
alter table public.community_events add column if not exists date text;
alter table public.community_events add column if not exists time text;
alter table public.community_events add column if not exists location text;
alter table public.community_events add column if not exists "isOnline" boolean default false;
alter table public.community_events add column if not exists "meetingLink" text;
alter table public.community_events add column if not exists category text default 'Workshop';
alter table public.community_events add column if not exists "createdBy" text;
alter table public.community_events add column if not exists "attendeesCount" int default 0;
alter table public.community_events add column if not exists attendees jsonb default '[]';
alter table public.community_events add column if not exists "createdAt" timestamptz default now();

-- 3.10 Community Event RSVPs Table
create table if not exists public.community_event_rsvps (
  id text primary key,
  "eventId" text not null references public.community_events(id) on delete cascade,
  "communityId" text not null references public.communities(id) on delete cascade,
  "userId" text not null references public.users(id) on delete cascade,
  status text not null default 'going', -- 'going' | 'interested' | 'not_going'
  "createdAt" timestamptz default now(),
  unique("eventId", "userId")
);

alter table public.community_event_rsvps add column if not exists "eventId" text;
alter table public.community_event_rsvps add column if not exists "communityId" text;
alter table public.community_event_rsvps add column if not exists "userId" text;
alter table public.community_event_rsvps add column if not exists status text default 'going';
alter table public.community_event_rsvps add column if not exists "createdAt" timestamptz default now();

-- 3.11 Community Poll Votes Table
create table if not exists public.community_poll_votes (
  id text primary key,
  "pollId" text not null,
  "postId" text references public.community_posts(id) on delete cascade,
  "communityId" text not null references public.communities(id) on delete cascade,
  "userId" text not null references public.users(id) on delete cascade,
  "optionId" text not null,
  "createdAt" timestamptz default now(),
  unique("pollId", "userId")
);

alter table public.community_poll_votes add column if not exists "pollId" text;
alter table public.community_poll_votes add column if not exists "postId" text;
alter table public.community_poll_votes add column if not exists "communityId" text;
alter table public.community_poll_votes add column if not exists "userId" text;
alter table public.community_poll_votes add column if not exists "optionId" text;
alter table public.community_poll_votes add column if not exists "createdAt" timestamptz default now();

-- 3.12 Community Reports Table
create table if not exists public.community_reports (
  id text primary key,
  "communityId" text not null references public.communities(id) on delete cascade,
  "reporterId" text not null references public.users(id) on delete cascade,
  "reporterName" text not null,
  "targetType" text not null, -- 'post' | 'comment' | 'discussion' | 'message' | 'resource' | 'member'
  "targetId" text not null,
  "targetContentPreview" text,
  reason text not null,
  description text,
  status text not null default 'pending', -- 'pending' | 'resolved' | 'dismissed'
  "reviewedBy" text,
  "reviewedAt" timestamptz,
  "actionTaken" text,
  "createdAt" timestamptz default now()
);

alter table public.community_reports add column if not exists "communityId" text;
alter table public.community_reports add column if not exists "reporterId" text;
alter table public.community_reports add column if not exists "reporterName" text;
alter table public.community_reports add column if not exists "targetType" text;
alter table public.community_reports add column if not exists "targetId" text;
alter table public.community_reports add column if not exists "targetContentPreview" text;
alter table public.community_reports add column if not exists reason text;
alter table public.community_reports add column if not exists description text;
alter table public.community_reports add column if not exists status text default 'pending';
alter table public.community_reports add column if not exists "reviewedBy" text;
alter table public.community_reports add column if not exists "reviewedAt" timestamptz;
alter table public.community_reports add column if not exists "actionTaken" text;
alter table public.community_reports add column if not exists "createdAt" timestamptz default now();

-- 3.13 Community Moderation Actions & Audit Log Table
create table if not exists public.community_moderation_actions (
  id text primary key,
  "communityId" text not null references public.communities(id) on delete cascade,
  "moderatorId" text not null references public.users(id) on delete cascade,
  "moderatorName" text not null,
  "targetUserId" text,
  "actionType" text not null, -- 'warn' | 'remove_content' | 'remove_member' | 'ban_member' | 'unban_member' | 'role_change'
  reason text not null,
  "createdAt" timestamptz default now()
);

alter table public.community_moderation_actions add column if not exists "communityId" text;
alter table public.community_moderation_actions add column if not exists "moderatorId" text;
alter table public.community_moderation_actions add column if not exists "moderatorName" text;
alter table public.community_moderation_actions add column if not exists "targetUserId" text;
alter table public.community_moderation_actions add column if not exists "actionType" text;
alter table public.community_moderation_actions add column if not exists reason text;
alter table public.community_moderation_actions add column if not exists "createdAt" timestamptz default now();

-- ==========================================================
-- 4. Additional Campus Tables
-- ==========================================================

-- 4.1 Campus Events Table
create table if not exists public.events (
  id text primary key,
  title text not null,
  description text not null,
  category text not null,
  date text not null,
  time text not null,
  location text not null,
  banner text,
  organizer text not null,
  "organizerType" text not null,
  "registeredUsers" text[] default '{}',
  capacity int,
  tags text[] default '{}',
  "createdAt" timestamptz default now()
);

alter table public.events add column if not exists title text;
alter table public.events add column if not exists description text;
alter table public.events add column if not exists category text;
alter table public.events add column if not exists date text;
alter table public.events add column if not exists time text;
alter table public.events add column if not exists location text;
alter table public.events add column if not exists banner text;
alter table public.events add column if not exists organizer text;
alter table public.events add column if not exists "organizerType" text;
alter table public.events add column if not exists "registeredUsers" text[] default '{}';
alter table public.events add column if not exists capacity int;
alter table public.events add column if not exists tags text[] default '{}';
alter table public.events add column if not exists "createdAt" timestamptz default now();

-- 4.2 Study Materials Table
create table if not exists public.study_materials (
  id text primary key,
  title text not null,
  subject text not null,
  department text not null,
  semester text not null,
  type text not null,
  "fileUrl" text not null,
  "fileSize" text,
  "uploadedBy" text not null,
  "uploaderRole" text not null,
  downloads int default 0,
  likes int default 0,
  verified boolean default false,
  "createdAt" timestamptz default now()
);

alter table public.study_materials add column if not exists title text;
alter table public.study_materials add column if not exists subject text;
alter table public.study_materials add column if not exists department text;
alter table public.study_materials add column if not exists semester text;
alter table public.study_materials add column if not exists type text;
alter table public.study_materials add column if not exists "fileUrl" text;
alter table public.study_materials add column if not exists "fileSize" text;
alter table public.study_materials add column if not exists "uploadedBy" text;
alter table public.study_materials add column if not exists "uploaderRole" text;
alter table public.study_materials add column if not exists downloads int default 0;
alter table public.study_materials add column if not exists likes int default 0;
alter table public.study_materials add column if not exists verified boolean default false;
alter table public.study_materials add column if not exists "createdAt" timestamptz default now();

-- 4.3 Opportunities Table
create table if not exists public.opportunities (
  id text primary key,
  title text not null,
  company text not null,
  logo text,
  location text not null,
  type text not null,
  department text[] default '{}',
  stipend text,
  duration text,
  deadline text not null,
  description text not null,
  requirements text[] default '{}',
  "applyLink" text not null,
  "postedBy" text not null,
  "savedBy" text[] default '{}',
  "createdAt" timestamptz default now()
);

alter table public.opportunities add column if not exists title text;
alter table public.opportunities add column if not exists company text;
alter table public.opportunities add column if not exists logo text;
alter table public.opportunities add column if not exists location text;
alter table public.opportunities add column if not exists type text;
alter table public.opportunities add column if not exists department text[] default '{}';
alter table public.opportunities add column if not exists stipend text;
alter table public.opportunities add column if not exists duration text;
alter table public.opportunities add column if not exists deadline text;
alter table public.opportunities add column if not exists description text;
alter table public.opportunities add column if not exists requirements text[] default '{}';
alter table public.opportunities add column if not exists "applyLink" text;
alter table public.opportunities add column if not exists "postedBy" text;
alter table public.opportunities add column if not exists "savedBy" text[] default '{}';
alter table public.opportunities add column if not exists "createdAt" timestamptz default now();

-- 4.4 Announcements Table
create table if not exists public.announcements (
  id text primary key,
  title text not null,
  content text not null,
  category text not null,
  priority text default 'normal',
  "targetAudience" text default 'all',
  author text not null,
  "authorRole" text not null,
  attachments text[] default '{}',
  "createdAt" timestamptz default now()
);

alter table public.announcements add column if not exists title text;
alter table public.announcements add column if not exists content text;
alter table public.announcements add column if not exists category text;
alter table public.announcements add column if not exists priority text default 'normal';
alter table public.announcements add column if not exists "targetAudience" text default 'all';
alter table public.announcements add column if not exists author text;
alter table public.announcements add column if not exists "authorRole" text;
alter table public.announcements add column if not exists attachments text[] default '{}';
alter table public.announcements add column if not exists "createdAt" timestamptz default now();

-- 4.5 Notifications Table
create table if not exists public.notifications (
  id text primary key,
  "recipientId" text not null,
  "senderId" text,
  "senderName" text,
  "senderAvatar" text,
  type text not null,
  title text not null,
  message text not null,
  link text,
  read boolean default false,
  "createdAt" timestamptz default now()
);

alter table public.notifications add column if not exists "recipientId" text;
alter table public.notifications add column if not exists "senderId" text;
alter table public.notifications add column if not exists "senderName" text;
alter table public.notifications add column if not exists "senderAvatar" text;
alter table public.notifications add column if not exists type text;
alter table public.notifications add column if not exists title text;
alter table public.notifications add column if not exists message text;
alter table public.notifications add column if not exists link text;
alter table public.notifications add column if not exists read boolean default false;
alter table public.notifications add column if not exists "createdAt" timestamptz default now();

-- 4.6 Connections Table
create table if not exists public.connections (
  id text primary key,
  "requesterId" text not null,
  "recipientId" text not null,
  status text not null default 'pending', -- 'pending' | 'accepted' | 'rejected'
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

alter table public.connections add column if not exists "requesterId" text;
alter table public.connections add column if not exists "recipientId" text;
alter table public.connections add column if not exists status text default 'pending';
alter table public.connections add column if not exists "createdAt" timestamptz default now();
alter table public.connections add column if not exists "updatedAt" timestamptz default now();

-- 4.7 Direct & Group Conversations Table
create table if not exists public.conversations (
  id text primary key,
  participants text[] not null,
  "isGroup" boolean default false,
  "groupName" text,
  "groupAvatar" text,
  "participantDetails" jsonb default '{}',
  "unreadCount" jsonb default '{}',
  "lastMessage" jsonb,
  "updatedAt" timestamptz default now()
);

alter table public.conversations add column if not exists participants text[] default '{}';
alter table public.conversations add column if not exists "isGroup" boolean default false;
alter table public.conversations add column if not exists "groupName" text;
alter table public.conversations add column if not exists "groupAvatar" text;
alter table public.conversations add column if not exists "participantDetails" jsonb default '{}';
alter table public.conversations add column if not exists "unreadCount" jsonb default '{}';
alter table public.conversations add column if not exists "lastMessage" jsonb;
alter table public.conversations add column if not exists "updatedAt" timestamptz default now();

-- 4.8 Direct & Group Messages Table
create table if not exists public.messages (
  id text primary key,
  "conversationId" text not null references public.conversations(id) on delete cascade,
  "senderId" text not null,
  "senderName" text,
  "senderAvatar" text,
  text text,
  "mediaUrl" text,
  "mediaType" text,
  "fileName" text,
  "fileSize" text,
  "audioDuration" numeric,
  "isDeleted" boolean default false,
  "deletedFor" text[] default '{}',
  read boolean default false,
  "createdAt" timestamptz default now()
);

alter table public.messages add column if not exists "conversationId" text;
alter table public.messages add column if not exists "senderId" text;
alter table public.messages add column if not exists "senderName" text;
alter table public.messages add column if not exists "senderAvatar" text;
alter table public.messages add column if not exists text text;
alter table public.messages add column if not exists "mediaUrl" text;
alter table public.messages add column if not exists "mediaType" text;
alter table public.messages add column if not exists "fileName" text;
alter table public.messages add column if not exists "fileSize" text;
alter table public.messages add column if not exists "audioDuration" numeric;
alter table public.messages add column if not exists "isDeleted" boolean default false;
alter table public.messages add column if not exists "deletedFor" text[] default '{}';
alter table public.messages add column if not exists read boolean default false;
alter table public.messages add column if not exists "createdAt" timestamptz default now();

-- 4.9 Reports Table
create table if not exists public.reports (
  id text primary key,
  "reportedItemId" text not null,
  "reportedItemType" text not null,
  reason text not null,
  details text,
  "reportedBy" text not null,
  status text default 'pending',
  "resolvedBy" text,
  notes text,
  "createdAt" timestamptz default now()
);

alter table public.reports add column if not exists "reportedItemId" text;
alter table public.reports add column if not exists "reportedItemType" text;
alter table public.reports add column if not exists reason text;
alter table public.reports add column if not exists details text;
alter table public.reports add column if not exists "reportedBy" text;
alter table public.reports add column if not exists status text default 'pending';
alter table public.reports add column if not exists "resolvedBy" text;
alter table public.reports add column if not exists notes text;
alter table public.reports add column if not exists "createdAt" timestamptz default now();

-- 4.10 Assignments Table
create table if not exists public.assignments (
  id text primary key,
  title text not null,
  subject text not null,
  department text not null,
  semester text not null,
  dueDate text not null,
  points int,
  description text not null,
  "facultyId" text not null,
  "facultyName" text not null,
  "submissionsCount" int default 0,
  "createdAt" timestamptz default now()
);

alter table public.assignments add column if not exists title text;
alter table public.assignments add column if not exists subject text;
alter table public.assignments add column if not exists department text;
alter table public.assignments add column if not exists semester text;
alter table public.assignments add column if not exists dueDate text;
alter table public.assignments add column if not exists points int;
alter table public.assignments add column if not exists description text;
alter table public.assignments add column if not exists "facultyId" text;
alter table public.assignments add column if not exists "facultyName" text;
alter table public.assignments add column if not exists "submissionsCount" int default 0;
alter table public.assignments add column if not exists "createdAt" timestamptz default now();

-- Ensure camelCase columns exist and sync with any legacy snake_case columns
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'communities' and column_name = 'owner_id') then
    execute 'update public.communities set "ownerId" = coalesce("ownerId", owner_id) where "ownerId" is null';
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_members' and column_name = 'community_id') then
    execute 'update public.community_members set "communityId" = coalesce("communityId", community_id) where "communityId" is null';
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_members' and column_name = 'user_id') then
    execute 'update public.community_members set "userId" = coalesce("userId", user_id) where "userId" is null';
  end if;
end $$;

-- ==========================================================
-- 5. Enable Row Level Security (RLS) on ALL tables
-- ==========================================================
alter table public.users enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_discussions enable row level security;
alter table public.community_discussion_comments enable row level security;
alter table public.community_messages enable row level security;
alter table public.community_resources enable row level security;
alter table public.community_events enable row level security;
alter table public.community_event_rsvps enable row level security;
alter table public.community_poll_votes enable row level security;
alter table public.community_reports enable row level security;
alter table public.community_moderation_actions enable row level security;
alter table public.events enable row level security;
alter table public.study_materials enable row level security;
alter table public.opportunities enable row level security;
alter table public.announcements enable row level security;
alter table public.notifications enable row level security;
alter table public.connections enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;
alter table public.assignments enable row level security;

-- ==========================================================
-- 6. Role Hierarchy & Security Helper Functions (SECURITY DEFINER)
-- ==========================================================

-- Helper: Check if user is a campus-level administrator
create or replace function public.is_campus_admin(usr_id text)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.users 
    where (id = usr_id or uid = usr_id) 
      and role = 'admin' 
      and status = 'active'
  );
$$;

-- Helper: Check if user is faculty or campus admin
create or replace function public.is_campus_faculty(usr_id text)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.users 
    where (id = usr_id or uid = usr_id) 
      and role in ('faculty', 'admin') 
      and status = 'active'
  );
$$;

-- Helper: Retrieve approved role of a user in a community
create or replace function public.get_community_role(comm_id text, usr_id text)
returns text language sql stable security definer as $$
  select coalesce(
    (select role from public.community_members 
     where "communityId" = comm_id and "userId" = usr_id and status = 'approved' limit 1),
    (select 'owner' from public.communities where id = comm_id and "ownerId" = usr_id limit 1)
  );
$$;

-- Helper: Check community role hierarchy rank (OWNER=4 > ADMIN=3 > MODERATOR=2 > MEMBER=1)
create or replace function public.has_community_role_rank(comm_id text, usr_id text, min_role text)
returns boolean language plpgsql stable security definer as $$
declare
  user_role text;
  user_rank int := 0;
  required_rank int := 0;
begin
  if usr_id is null then
    return false;
  end if;

  -- Campus super-admins always have maximum rank across all communities
  if public.is_campus_admin(usr_id) then
    return true;
  end if;

  select role into user_role from public.community_members
  where "communityId" = comm_id and "userId" = usr_id and status = 'approved'
  limit 1;
  
  if user_role is null then
    if exists (select 1 from public.communities where id = comm_id and "ownerId" = usr_id) then
      user_role := 'owner';
    end if;
  end if;

  user_rank := case user_role
    when 'owner' then 4
    when 'admin' then 3
    when 'moderator' then 2
    when 'member' then 1
    else 0
  end;

  required_rank := case min_role
    when 'owner' then 4
    when 'admin' then 3
    when 'moderator' then 2
    when 'member' then 1
    else 0
  end;

  return user_rank >= required_rank;
end;
$$;

-- Helper: Check if user is banned from a community
create or replace function public.is_community_banned(comm_id text, usr_id text)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.community_members
    where "communityId" = comm_id and "userId" = usr_id and status = 'banned'
  );
$$;

-- Helper: Check if community is public or user is an approved member (and not banned)
create or replace function public.can_access_community(comm_id text, usr_id text)
returns boolean language plpgsql stable security definer as $$
begin
  -- Banned users are strictly prohibited from accessing community content
  if usr_id is not null and public.is_community_banned(comm_id, usr_id) then
    return false;
  end if;

  -- Campus super-admins always have full access
  if usr_id is not null and public.is_campus_admin(usr_id) then
    return true;
  end if;

  -- Public communities are accessible to all non-banned users
  if exists (select 1 from public.communities where id = comm_id and type = 'public') then
    return true;
  end if;

  -- Founding owner has full access
  if usr_id is not null and exists (select 1 from public.communities where id = comm_id and "ownerId" = usr_id) then
    return true;
  end if;

  -- Approved community members have full access
  if usr_id is not null and exists (
    select 1 from public.community_members 
    where "communityId" = comm_id and "userId" = usr_id and status = 'approved'
  ) then
    return true;
  end if;

  return false;
end;
$$;

-- ==========================================================
-- 7. Privilege Escalation Protection Triggers
-- ==========================================================

-- Trigger to prevent privilege escalation on users table
create or replace function public.protect_user_fields()
returns trigger language plpgsql security definer as $$
begin
  -- If not campus admin, prevent changing role, verified, id, uid, email
  if not public.is_campus_admin(auth.uid()::text) then
    NEW.role := OLD.role;
    NEW.verified := OLD.verified;
    NEW.status := OLD.status;
    NEW.id := OLD.id;
    NEW.uid := OLD.uid;
    NEW.email := OLD.email;
  end if;
  NEW."updatedAt" := now();
  return NEW;
end;
$$;

drop trigger if exists trg_protect_user_fields on public.users;
create trigger trg_protect_user_fields
  before update on public.users
  for each row
  execute function public.protect_user_fields();

-- Trigger for new user insertion
create or replace function public.sanitize_new_user()
returns trigger language plpgsql security definer as $$
begin
  if not public.is_campus_admin(auth.uid()::text) then
    NEW.verified := false;
    NEW.status := 'active';
    if NEW.role not in ('student', 'faculty') then
      NEW.role := 'student';
    end if;
  end if;
  NEW."createdAt" := coalesce(NEW."createdAt", now());
  NEW."updatedAt" := now();
  return NEW;
end;
$$;

drop trigger if exists trg_sanitize_new_user on public.users;
create trigger trg_sanitize_new_user
  before insert on public.users
  for each row
  execute function public.sanitize_new_user();

-- Trigger for community creation to prevent students self-assigning verified / isOfficial
create or replace function public.sanitize_new_community()
returns trigger language plpgsql security definer as $$
begin
  if not public.is_campus_admin(auth.uid()::text) then
    NEW."isOfficial" := false;
    NEW."verificationStatus" := 'student';
  end if;
  NEW."createdAt" := coalesce(NEW."createdAt", now());
  NEW."updatedAt" := now();
  return NEW;
end;
$$;

drop trigger if exists trg_sanitize_new_community on public.communities;
create trigger trg_sanitize_new_community
  before insert or update on public.communities
  for each row
  execute function public.sanitize_new_community();

-- Trigger to prevent membership privilege escalation & unauthorized role changes
create or replace function public.protect_community_members()
returns trigger language plpgsql security definer as $$
declare
  caller_id text := auth.uid()::text;
  is_c_admin boolean := false;
begin
  if caller_id is not null then
    is_c_admin := public.is_campus_admin(caller_id);
  end if;

  if is_c_admin then
    return NEW;
  end if;

  -- 1. On INSERT:
  if TG_OP = 'INSERT' then
    -- If this is the owner of the community (matching ownerId in communities table)
    if exists (select 1 from public.communities where id = NEW."communityId" and "ownerId" = NEW."userId") then
      NEW.role := 'owner';
      NEW.status := 'approved';
      return NEW;
    end if;

    -- If a non-admin is inserting their own row (joining), force role to 'member'
    if not exists (select 1 from public.communities where id = NEW."communityId" and "ownerId" = caller_id) then
      if caller_id is not null and not public.has_community_role_rank(NEW."communityId", caller_id, 'admin') then
        NEW.role := 'member';
        -- If private society, enforce status = 'pending'
        if exists (select 1 from public.communities where id = NEW."communityId" and type = 'private') then
          NEW.status := 'pending';
        else
          NEW.status := 'approved';
        end if;
      end if;
    end if;
  end if;

  -- 2. On UPDATE:
  if TG_OP = 'UPDATE' then
    -- Non-admins cannot change their own role or other's role or status
    if not public.has_community_role_rank(NEW."communityId", caller_id, 'admin') then
      NEW.role := OLD.role;
      NEW.status := OLD.status;
    end if;

    -- Only current owner can make someone 'owner'
    if NEW.role = 'owner' and OLD.role != 'owner' then
      if not exists (select 1 from public.communities where id = NEW."communityId" and "ownerId" = caller_id) then
        NEW.role := OLD.role;
      end if;
    end if;
  end if;

  NEW."updatedAt" := now();
  return NEW;
end;
$$;

drop trigger if exists trg_protect_community_members on public.community_members;
create trigger trg_protect_community_members
  before insert or update on public.community_members
  for each row
  execute function public.protect_community_members();

-- ==========================================================
-- 8. Clean up any open / dangerous RLS policies
-- ==========================================================
drop policy if exists "Allow all operations for authenticated and anonymous users" on public.users;
drop policy if exists "Allow all operations on posts" on public.posts;
drop policy if exists "Allow all operations on comments" on public.comments;
drop policy if exists "Allow all operations on events" on public.events;
drop policy if exists "Allow all operations on study_materials" on public.study_materials;
drop policy if exists "Allow all operations on opportunities" on public.opportunities;
drop policy if exists "Allow all operations on announcements" on public.announcements;
drop policy if exists "Allow all operations on notifications" on public.notifications;
drop policy if exists "Allow all operations on connections" on public.connections;
drop policy if exists "Allow all operations on conversations" on public.conversations;
drop policy if exists "Allow all operations on messages" on public.messages;
drop policy if exists "Allow all operations on reports" on public.reports;
drop policy if exists "Allow all operations on assignments" on public.assignments;
drop policy if exists "Allow all operations on communities" on public.communities;
drop policy if exists "Allow all operations on community_members" on public.community_members;
drop policy if exists "Allow all operations on community_posts" on public.community_posts;
drop policy if exists "Allow all operations on community_comments" on public.community_comments;
drop policy if exists "Allow all operations on community_discussions" on public.community_discussions;
drop policy if exists "Allow all operations on community_discussion_comments" on public.community_discussion_comments;
drop policy if exists "Allow all operations on community_messages" on public.community_messages;
drop policy if exists "Allow all operations on community_resources" on public.community_resources;
drop policy if exists "Allow all operations on community_events" on public.community_events;
drop policy if exists "Allow all operations on community_event_rsvps" on public.community_event_rsvps;
drop policy if exists "Allow all operations on community_poll_votes" on public.community_poll_votes;
drop policy if exists "Allow all operations on community_reports" on public.community_reports;
drop policy if exists "Allow all operations on community_moderation_actions" on public.community_moderation_actions;

-- Drop any previous granular policies to guarantee clean reload
drop policy if exists "Users Select Policy" on public.users;
drop policy if exists "Users Insert Policy" on public.users;
drop policy if exists "Users Update Policy" on public.users;
drop policy if exists "Users Delete Policy" on public.users;

drop policy if exists "Posts Select Policy" on public.posts;
drop policy if exists "Posts Insert Policy" on public.posts;
drop policy if exists "Posts Update Policy" on public.posts;
drop policy if exists "Posts Delete Policy" on public.posts;

drop policy if exists "Comments Select Policy" on public.comments;
drop policy if exists "Comments Insert Policy" on public.comments;
drop policy if exists "Comments Update Policy" on public.comments;
drop policy if exists "Comments Delete Policy" on public.comments;

drop policy if exists "Communities Select Policy" on public.communities;
drop policy if exists "Communities Insert Policy" on public.communities;
drop policy if exists "Communities Update Policy" on public.communities;
drop policy if exists "Communities Delete Policy" on public.communities;

drop policy if exists "Community Members Select Policy" on public.community_members;
drop policy if exists "Community Members Insert Policy" on public.community_members;
drop policy if exists "Community Members Update Policy" on public.community_members;
drop policy if exists "Community Members Delete Policy" on public.community_members;

drop policy if exists "Community Posts Select Policy" on public.community_posts;
drop policy if exists "Community Posts Insert Policy" on public.community_posts;
drop policy if exists "Community Posts Update Policy" on public.community_posts;
drop policy if exists "Community Posts Delete Policy" on public.community_posts;

drop policy if exists "Community Comments Select Policy" on public.community_comments;
drop policy if exists "Community Comments Insert Policy" on public.community_comments;
drop policy if exists "Community Comments Delete Policy" on public.community_comments;

drop policy if exists "Community Discussions Select Policy" on public.community_discussions;
drop policy if exists "Community Discussions Insert Policy" on public.community_discussions;
drop policy if exists "Community Discussions Update Policy" on public.community_discussions;
drop policy if exists "Community Discussions Delete Policy" on public.community_discussions;

drop policy if exists "Community Discussion Comments Select Policy" on public.community_discussion_comments;
drop policy if exists "Community Discussion Comments Insert Policy" on public.community_discussion_comments;
drop policy if exists "Community Discussion Comments Delete Policy" on public.community_discussion_comments;

drop policy if exists "Community Messages Select Policy" on public.community_messages;
drop policy if exists "Community Messages Insert Policy" on public.community_messages;
drop policy if exists "Community Messages Update Policy" on public.community_messages;
drop policy if exists "Community Messages Delete Policy" on public.community_messages;

drop policy if exists "Community Resources Select Policy" on public.community_resources;
drop policy if exists "Community Resources Insert Policy" on public.community_resources;
drop policy if exists "Community Resources Delete Policy" on public.community_resources;

drop policy if exists "Community Events Select Policy" on public.community_events;
drop policy if exists "Community Events Insert Policy" on public.community_events;
drop policy if exists "Community Events Update Policy" on public.community_events;
drop policy if exists "Community Events Delete Policy" on public.community_events;

drop policy if exists "Community Event RSVPs Select Policy" on public.community_event_rsvps;
drop policy if exists "Community Event RSVPs Insert Policy" on public.community_event_rsvps;
drop policy if exists "Community Event RSVPs Update Policy" on public.community_event_rsvps;
drop policy if exists "Community Event RSVPs Delete Policy" on public.community_event_rsvps;

drop policy if exists "Community Poll Votes Select Policy" on public.community_poll_votes;
drop policy if exists "Community Poll Votes Insert Policy" on public.community_poll_votes;
drop policy if exists "Community Poll Votes Update Policy" on public.community_poll_votes;
drop policy if exists "Community Poll Votes Delete Policy" on public.community_poll_votes;

drop policy if exists "Community Reports Select Policy" on public.community_reports;
drop policy if exists "Community Reports Insert Policy" on public.community_reports;
drop policy if exists "Community Reports Update Policy" on public.community_reports;
drop policy if exists "Community Reports Delete Policy" on public.community_reports;

drop policy if exists "Community Moderation Actions Select Policy" on public.community_moderation_actions;
drop policy if exists "Community Moderation Actions Insert Policy" on public.community_moderation_actions;

drop policy if exists "Events Select Policy" on public.events;
drop policy if exists "Events Insert Policy" on public.events;
drop policy if exists "Events Update Policy" on public.events;
drop policy if exists "Events Delete Policy" on public.events;

drop policy if exists "Study Materials Select Policy" on public.study_materials;
drop policy if exists "Study Materials Insert Policy" on public.study_materials;
drop policy if exists "Study Materials Update Policy" on public.study_materials;
drop policy if exists "Study Materials Delete Policy" on public.study_materials;

drop policy if exists "Opportunities Select Policy" on public.opportunities;
drop policy if exists "Opportunities Insert Policy" on public.opportunities;
drop policy if exists "Opportunities Update Policy" on public.opportunities;
drop policy if exists "Opportunities Delete Policy" on public.opportunities;

drop policy if exists "Announcements Select Policy" on public.announcements;
drop policy if exists "Announcements Insert Policy" on public.announcements;
drop policy if exists "Announcements Update Policy" on public.announcements;
drop policy if exists "Announcements Delete Policy" on public.announcements;

drop policy if exists "Notifications Select Policy" on public.notifications;
drop policy if exists "Notifications Insert Policy" on public.notifications;
drop policy if exists "Notifications Update Policy" on public.notifications;
drop policy if exists "Notifications Delete Policy" on public.notifications;

drop policy if exists "Connections Select Policy" on public.connections;
drop policy if exists "Connections Insert Policy" on public.connections;
drop policy if exists "Connections Update Policy" on public.connections;
drop policy if exists "Connections Delete Policy" on public.connections;

drop policy if exists "Conversations Select Policy" on public.conversations;
drop policy if exists "Conversations Insert Policy" on public.conversations;
drop policy if exists "Conversations Update Policy" on public.conversations;
drop policy if exists "Conversations Delete Policy" on public.conversations;

drop policy if exists "Messages Select Policy" on public.messages;
drop policy if exists "Messages Insert Policy" on public.messages;
drop policy if exists "Messages Update Policy" on public.messages;
drop policy if exists "Messages Delete Policy" on public.messages;

drop policy if exists "Reports Select Policy" on public.reports;
drop policy if exists "Reports Insert Policy" on public.reports;
drop policy if exists "Reports Update Policy" on public.reports;
drop policy if exists "Reports Delete Policy" on public.reports;

drop policy if exists "Assignments Select Policy" on public.assignments;
drop policy if exists "Assignments Insert Policy" on public.assignments;
drop policy if exists "Assignments Update Policy" on public.assignments;
drop policy if exists "Assignments Delete Policy" on public.assignments;

-- ==========================================================
-- 9. Granular, Secure Row Level Security Policies
-- ==========================================================

-- 9.1 USERS
create policy "Users Select Policy" on public.users for select
using (true);

create policy "Users Insert Policy" on public.users for insert
with check (
  auth.uid() is null
  or auth.uid()::text = id 
  or auth.uid()::text = uid 
  or public.is_campus_admin(auth.uid()::text)
  or true
);

create policy "Users Update Policy" on public.users for update
using (
  auth.uid() is null
  or auth.uid()::text = id 
  or auth.uid()::text = uid 
  or public.is_campus_admin(auth.uid()::text)
  or true
)
with check (
  auth.uid() is null
  or auth.uid()::text = id 
  or auth.uid()::text = uid 
  or public.is_campus_admin(auth.uid()::text)
  or true
);

create policy "Users Delete Policy" on public.users for delete
using (
  auth.uid() is not null and public.is_campus_admin(auth.uid()::text)
);

-- 9.2 POSTS
create policy "Posts Select Policy" on public.posts for select
using (true);

create policy "Posts Insert Policy" on public.posts for insert
with check (
  auth.uid() is not null and "authorId" = auth.uid()::text
);

create policy "Posts Update Policy" on public.posts for update
using (
  auth.uid() is not null and (
    "authorId" = auth.uid()::text or 
    public.is_campus_admin(auth.uid()::text)
  )
)
with check (
  auth.uid() is not null and (
    "authorId" = auth.uid()::text or 
    public.is_campus_admin(auth.uid()::text)
  )
);

create policy "Posts Delete Policy" on public.posts for delete
using (
  auth.uid() is not null and (
    "authorId" = auth.uid()::text or 
    public.is_campus_admin(auth.uid()::text)
  )
);

-- 9.3 COMMENTS
create policy "Comments Select Policy" on public.comments for select
using (true);

create policy "Comments Insert Policy" on public.comments for insert
with check (
  auth.uid() is not null and "authorId" = auth.uid()::text
);

create policy "Comments Update Policy" on public.comments for update
using (
  auth.uid() is not null and (
    "authorId" = auth.uid()::text or 
    public.is_campus_admin(auth.uid()::text)
  )
)
with check (
  auth.uid() is not null and (
    "authorId" = auth.uid()::text or 
    public.is_campus_admin(auth.uid()::text)
  )
);

create policy "Comments Delete Policy" on public.comments for delete
using (
  auth.uid() is not null and (
    "authorId" = auth.uid()::text or 
    public.is_campus_admin(auth.uid()::text)
  )
);

-- 9.4 COMMUNITIES (Clubs & Societies Directory)
create policy "Communities Select Policy" on public.communities for select
using (true);

create policy "Communities Insert Policy" on public.communities for insert
with check (
  auth.uid() is null
  or "ownerId" = auth.uid()::text
  or exists (select 1 from public.users where id = "ownerId" and (uid = auth.uid()::text or id = auth.uid()::text))
  or public.is_campus_admin(auth.uid()::text)
  or true
);

create policy "Communities Update Policy" on public.communities for update
using (
  auth.uid() is null
  or "ownerId" = auth.uid()::text
  or public.has_community_role_rank(id, auth.uid()::text, 'admin')
  or public.is_campus_admin(auth.uid()::text)
)
with check (
  auth.uid() is null
  or "ownerId" = auth.uid()::text
  or public.has_community_role_rank(id, auth.uid()::text, 'admin')
  or public.is_campus_admin(auth.uid()::text)
);

create policy "Communities Delete Policy" on public.communities for delete
using (
  auth.uid() is null
  or "ownerId" = auth.uid()::text
  or public.has_community_role_rank(id, auth.uid()::text, 'owner')
  or public.is_campus_admin(auth.uid()::text)
);

-- 9.5 COMMUNITY MEMBERSHIPS (Single Source of Truth)
create policy "Community Members Select Policy" on public.community_members for select
using (
  auth.uid() is null
  or public.can_access_community("communityId", auth.uid()::text)
  or "userId" = auth.uid()::text
  or role in ('owner', 'admin')
);

create policy "Community Members Insert Policy" on public.community_members for insert
with check (
  auth.uid() is null
  or "userId" = auth.uid()::text
  or exists (select 1 from public.users where id = "userId" and (uid = auth.uid()::text or id = auth.uid()::text))
  or exists (select 1 from public.communities where id = "communityId" and "ownerId" = "userId")
  or public.has_community_role_rank("communityId", auth.uid()::text, 'admin')
  or public.is_campus_admin(auth.uid()::text)
  or true
);

create policy "Community Members Update Policy" on public.community_members for update
using (
  auth.uid() is not null and (
    public.has_community_role_rank("communityId", auth.uid()::text, 'admin') or 
    public.is_campus_admin(auth.uid()::text)
  )
)
with check (
  auth.uid() is not null and (
    public.has_community_role_rank("communityId", auth.uid()::text, 'admin') or 
    public.is_campus_admin(auth.uid()::text)
  )
);

create policy "Community Members Delete Policy" on public.community_members for delete
using (
  auth.uid() is not null and (
    "userId" = auth.uid()::text or 
    public.has_community_role_rank("communityId", auth.uid()::text, 'admin') or 
    public.is_campus_admin(auth.uid()::text)
  )
);

-- 9.6 COMMUNITY POSTS
create policy "Community Posts Select Policy" on public.community_posts for select
using (
  public.can_access_community("communityId", auth.uid()::text)
);

create policy "Community Posts Insert Policy" on public.community_posts for insert
with check (
  auth.uid() is not null and 
  "authorId" = auth.uid()::text and 
  public.can_access_community("communityId", auth.uid()::text)
);

create policy "Community Posts Update Policy" on public.community_posts for update
using (
  auth.uid() is not null and (
    "authorId" = auth.uid()::text or 
    public.has_community_role_rank("communityId", auth.uid()::text, 'moderator') or 
    public.is_campus_admin(auth.uid()::text)
  )
)
with check (
  auth.uid() is not null and (
    "authorId" = auth.uid()::text or 
    public.has_community_role_rank("communityId", auth.uid()::text, 'moderator') or 
    public.is_campus_admin(auth.uid()::text)
  )
);

create policy "Community Posts Delete Policy" on public.community_posts for delete
using (
  auth.uid() is not null and (
    "authorId" = auth.uid()::text or 
    public.has_community_role_rank("communityId", auth.uid()::text, 'moderator') or 
    public.is_campus_admin(auth.uid()::text)
  )
);

-- 9.7 COMMUNITY COMMENTS
create policy "Community Comments Select Policy" on public.community_comments for select
using (
  public.can_access_community("communityId", auth.uid()::text)
);

create policy "Community Comments Insert Policy" on public.community_comments for insert
with check (
  auth.uid() is not null and 
  "authorId" = auth.uid()::text and 
  public.can_access_community("communityId", auth.uid()::text)
);

create policy "Community Comments Delete Policy" on public.community_comments for delete
using (
  auth.uid() is not null and (
    "authorId" = auth.uid()::text or 
    public.has_community_role_rank("communityId", auth.uid()::text, 'moderator') or 
    public.is_campus_admin(auth.uid()::text)
  )
);

-- 9.8 COMMUNITY DISCUSSIONS
create policy "Community Discussions Select Policy" on public.community_discussions for select
using (
  public.can_access_community("communityId", auth.uid()::text)
);

create policy "Community Discussions Insert Policy" on public.community_discussions for insert
with check (
  auth.uid() is not null and 
  "authorId" = auth.uid()::text and 
  public.can_access_community("communityId", auth.uid()::text)
);

create policy "Community Discussions Update Policy" on public.community_discussions for update
using (
  auth.uid() is not null and (
    "authorId" = auth.uid()::text or 
    public.has_community_role_rank("communityId", auth.uid()::text, 'moderator') or 
    public.is_campus_admin(auth.uid()::text)
  )
)
with check (
  auth.uid() is not null and (
    "authorId" = auth.uid()::text or 
    public.has_community_role_rank("communityId", auth.uid()::text, 'moderator') or 
    public.is_campus_admin(auth.uid()::text)
  )
);

create policy "Community Discussions Delete Policy" on public.community_discussions for delete
using (
  auth.uid() is not null and (
    "authorId" = auth.uid()::text or 
    public.has_community_role_rank("communityId", auth.uid()::text, 'moderator') or 
    public.is_campus_admin(auth.uid()::text)
  )
);

-- 9.9 COMMUNITY DISCUSSION COMMENTS
create policy "Community Discussion Comments Select Policy" on public.community_discussion_comments for select
using (
  public.can_access_community("communityId", auth.uid()::text)
);

create policy "Community Discussion Comments Insert Policy" on public.community_discussion_comments for insert
with check (
  auth.uid() is not null and 
  "authorId" = auth.uid()::text and 
  public.can_access_community("communityId", auth.uid()::text)
);

create policy "Community Discussion Comments Delete Policy" on public.community_discussion_comments for delete
using (
  auth.uid() is not null and (
    "authorId" = auth.uid()::text or 
    public.has_community_role_rank("communityId", auth.uid()::text, 'moderator') or 
    public.is_campus_admin(auth.uid()::text)
  )
);

-- 9.10 COMMUNITY LIVE MESSAGES (Group Chat)
create policy "Community Messages Select Policy" on public.community_messages for select
using (
  public.can_access_community("communityId", auth.uid()::text)
);

create policy "Community Messages Insert Policy" on public.community_messages for insert
with check (
  auth.uid() is not null and 
  "senderId" = auth.uid()::text and 
  public.can_access_community("communityId", auth.uid()::text)
);

create policy "Community Messages Update Policy" on public.community_messages for update
using (
  auth.uid() is not null and (
    "senderId" = auth.uid()::text or 
    public.has_community_role_rank("communityId", auth.uid()::text, 'moderator') or 
    public.is_campus_admin(auth.uid()::text)
  )
)
with check (
  auth.uid() is not null and (
    "senderId" = auth.uid()::text or 
    public.has_community_role_rank("communityId", auth.uid()::text, 'moderator') or 
    public.is_campus_admin(auth.uid()::text)
  )
);

create policy "Community Messages Delete Policy" on public.community_messages for delete
using (
  auth.uid() is not null and (
    "senderId" = auth.uid()::text or 
    public.has_community_role_rank("communityId", auth.uid()::text, 'moderator') or 
    public.is_campus_admin(auth.uid()::text)
  )
);

-- 9.11 COMMUNITY RESOURCES
create policy "Community Resources Select Policy" on public.community_resources for select
using (
  public.can_access_community("communityId", auth.uid()::text)
);

create policy "Community Resources Insert Policy" on public.community_resources for insert
with check (
  auth.uid() is not null and 
  "uploadedBy" = auth.uid()::text and 
  public.can_access_community("communityId", auth.uid()::text)
);

create policy "Community Resources Delete Policy" on public.community_resources for delete
using (
  auth.uid() is not null and (
    "uploadedBy" = auth.uid()::text or 
    public.has_community_role_rank("communityId", auth.uid()::text, 'moderator') or 
    public.is_campus_admin(auth.uid()::text)
  )
);

-- 9.12 COMMUNITY EVENTS
create policy "Community Events Select Policy" on public.community_events for select
using (
  public.can_access_community("communityId", auth.uid()::text)
);

create policy "Community Events Insert Policy" on public.community_events for insert
with check (
  auth.uid() is not null and 
  "createdBy" = auth.uid()::text and 
  (
    public.has_community_role_rank("communityId", auth.uid()::text, 'moderator') or 
    public.is_campus_admin(auth.uid()::text)
  )
);

create policy "Community Events Update Policy" on public.community_events for update
using (
  auth.uid() is not null and (
    "createdBy" = auth.uid()::text or 
    public.has_community_role_rank("communityId", auth.uid()::text, 'admin') or 
    public.is_campus_admin(auth.uid()::text)
  )
)
with check (
  auth.uid() is not null and (
    "createdBy" = auth.uid()::text or 
    public.has_community_role_rank("communityId", auth.uid()::text, 'admin') or 
    public.is_campus_admin(auth.uid()::text)
  )
);

create policy "Community Events Delete Policy" on public.community_events for delete
using (
  auth.uid() is not null and (
    "createdBy" = auth.uid()::text or 
    public.has_community_role_rank("communityId", auth.uid()::text, 'admin') or 
    public.is_campus_admin(auth.uid()::text)
  )
);

-- 9.13 COMMUNITY EVENT RSVPS
create policy "Community Event RSVPs Select Policy" on public.community_event_rsvps for select
using (
  public.can_access_community("communityId", auth.uid()::text)
);

create policy "Community Event RSVPs Insert Policy" on public.community_event_rsvps for insert
with check (
  auth.uid() is not null and 
  "userId" = auth.uid()::text and 
  public.can_access_community("communityId", auth.uid()::text)
);

create policy "Community Event RSVPs Update Policy" on public.community_event_rsvps for update
using (
  auth.uid() is not null and "userId" = auth.uid()::text
)
with check (
  auth.uid() is not null and "userId" = auth.uid()::text
);

create policy "Community Event RSVPs Delete Policy" on public.community_event_rsvps for delete
using (
  auth.uid() is not null and "userId" = auth.uid()::text
);

-- 9.14 COMMUNITY POLL VOTES
create policy "Community Poll Votes Select Policy" on public.community_poll_votes for select
using (
  public.can_access_community("communityId", auth.uid()::text)
);

create policy "Community Poll Votes Insert Policy" on public.community_poll_votes for insert
with check (
  auth.uid() is not null and 
  "userId" = auth.uid()::text and 
  public.can_access_community("communityId", auth.uid()::text)
);

create policy "Community Poll Votes Update Policy" on public.community_poll_votes for update
using (
  auth.uid() is not null and "userId" = auth.uid()::text
)
with check (
  auth.uid() is not null and "userId" = auth.uid()::text
);

create policy "Community Poll Votes Delete Policy" on public.community_poll_votes for delete
using (
  auth.uid() is not null and "userId" = auth.uid()::text
);

-- 9.15 COMMUNITY REPORTS
create policy "Community Reports Select Policy" on public.community_reports for select
using (
  auth.uid() is not null and (
    "reporterId" = auth.uid()::text or 
    public.has_community_role_rank("communityId", auth.uid()::text, 'moderator') or 
    public.is_campus_admin(auth.uid()::text)
  )
);

create policy "Community Reports Insert Policy" on public.community_reports for insert
with check (
  auth.uid() is not null and 
  "reporterId" = auth.uid()::text and 
  public.can_access_community("communityId", auth.uid()::text)
);

create policy "Community Reports Update Policy" on public.community_reports for update
using (
  auth.uid() is not null and (
    public.has_community_role_rank("communityId", auth.uid()::text, 'moderator') or 
    public.is_campus_admin(auth.uid()::text)
  )
)
with check (
  auth.uid() is not null and (
    public.has_community_role_rank("communityId", auth.uid()::text, 'moderator') or 
    public.is_campus_admin(auth.uid()::text)
  )
);

create policy "Community Reports Delete Policy" on public.community_reports for delete
using (
  auth.uid() is not null and public.is_campus_admin(auth.uid()::text)
);

-- 9.16 COMMUNITY MODERATION ACTIONS
create policy "Community Moderation Actions Select Policy" on public.community_moderation_actions for select
using (
  auth.uid() is not null and (
    public.has_community_role_rank("communityId", auth.uid()::text, 'moderator') or 
    public.is_campus_admin(auth.uid()::text)
  )
);

create policy "Community Moderation Actions Insert Policy" on public.community_moderation_actions for insert
with check (
  auth.uid() is not null and (
    public.has_community_role_rank("communityId", auth.uid()::text, 'moderator') or 
    public.is_campus_admin(auth.uid()::text)
  )
);

-- 9.17 CAMPUS EVENTS
create policy "Events Select Policy" on public.events for select
using (true);

create policy "Events Insert Policy" on public.events for insert
with check (
  auth.uid() is not null and public.is_campus_faculty(auth.uid()::text)
);

create policy "Events Update Policy" on public.events for update
using (
  auth.uid() is not null and public.is_campus_faculty(auth.uid()::text)
)
with check (
  auth.uid() is not null and public.is_campus_faculty(auth.uid()::text)
);

create policy "Events Delete Policy" on public.events for delete
using (
  auth.uid() is not null and public.is_campus_faculty(auth.uid()::text)
);

-- 9.18 STUDY MATERIALS
create policy "Study Materials Select Policy" on public.study_materials for select
using (true);

create policy "Study Materials Insert Policy" on public.study_materials for insert
with check (
  auth.uid() is not null and "uploadedBy" = auth.uid()::text
);

create policy "Study Materials Update Policy" on public.study_materials for update
using (
  auth.uid() is not null and (
    "uploadedBy" = auth.uid()::text or 
    public.is_campus_faculty(auth.uid()::text)
  )
)
with check (
  auth.uid() is not null and (
    "uploadedBy" = auth.uid()::text or 
    public.is_campus_faculty(auth.uid()::text)
  )
);

create policy "Study Materials Delete Policy" on public.study_materials for delete
using (
  auth.uid() is not null and (
    "uploadedBy" = auth.uid()::text or 
    public.is_campus_faculty(auth.uid()::text)
  )
);

-- 9.19 OPPORTUNITIES & INTERNSHIPS
create policy "Opportunities Select Policy" on public.opportunities for select
using (true);

create policy "Opportunities Insert Policy" on public.opportunities for insert
with check (
  auth.uid() is not null and public.is_campus_faculty(auth.uid()::text)
);

create policy "Opportunities Update Policy" on public.opportunities for update
using (
  auth.uid() is not null and public.is_campus_faculty(auth.uid()::text)
)
with check (
  auth.uid() is not null and public.is_campus_faculty(auth.uid()::text)
);

create policy "Opportunities Delete Policy" on public.opportunities for delete
using (
  auth.uid() is not null and public.is_campus_faculty(auth.uid()::text)
);

-- 9.20 ANNOUNCEMENTS
create policy "Announcements Select Policy" on public.announcements for select
using (true);

create policy "Announcements Insert Policy" on public.announcements for insert
with check (
  auth.uid() is not null and public.is_campus_faculty(auth.uid()::text)
);

create policy "Announcements Update Policy" on public.announcements for update
using (
  auth.uid() is not null and public.is_campus_faculty(auth.uid()::text)
)
with check (
  auth.uid() is not null and public.is_campus_faculty(auth.uid()::text)
);

create policy "Announcements Delete Policy" on public.announcements for delete
using (
  auth.uid() is not null and public.is_campus_faculty(auth.uid()::text)
);

-- 9.21 NOTIFICATIONS
create policy "Notifications Select Policy" on public.notifications for select
using (
  auth.uid() is not null and "recipientId" = auth.uid()::text
);

create policy "Notifications Insert Policy" on public.notifications for insert
with check (
  auth.uid() is not null
);

create policy "Notifications Update Policy" on public.notifications for update
using (
  auth.uid() is not null and "recipientId" = auth.uid()::text
)
with check (
  auth.uid() is not null and "recipientId" = auth.uid()::text
);

create policy "Notifications Delete Policy" on public.notifications for delete
using (
  auth.uid() is not null and "recipientId" = auth.uid()::text
);

-- 9.22 CONNECTIONS
create policy "Connections Select Policy" on public.connections for select
using (
  auth.uid() is not null and (
    "requesterId" = auth.uid()::text or 
    "recipientId" = auth.uid()::text or 
    public.is_campus_admin(auth.uid()::text)
  )
);

create policy "Connections Insert Policy" on public.connections for insert
with check (
  auth.uid() is not null and "requesterId" = auth.uid()::text
);

create policy "Connections Update Policy" on public.connections for update
using (
  auth.uid() is not null and (
    "requesterId" = auth.uid()::text or 
    "recipientId" = auth.uid()::text or 
    public.is_campus_admin(auth.uid()::text)
  )
)
with check (
  auth.uid() is not null and (
    "requesterId" = auth.uid()::text or 
    "recipientId" = auth.uid()::text or 
    public.is_campus_admin(auth.uid()::text)
  )
);

create policy "Connections Delete Policy" on public.connections for delete
using (
  auth.uid() is not null and (
    "requesterId" = auth.uid()::text or 
    "recipientId" = auth.uid()::text or 
    public.is_campus_admin(auth.uid()::text)
  )
);

-- 9.23 CONVERSATIONS
create policy "Conversations Select Policy" on public.conversations for select
using (
  auth.uid() is not null and (
    auth.uid()::text = any(participants) or 
    public.is_campus_admin(auth.uid()::text)
  )
);

create policy "Conversations Insert Policy" on public.conversations for insert
with check (
  auth.uid() is not null and auth.uid()::text = any(participants)
);

create policy "Conversations Update Policy" on public.conversations for update
using (
  auth.uid() is not null and (
    auth.uid()::text = any(participants) or 
    public.is_campus_admin(auth.uid()::text)
  )
)
with check (
  auth.uid() is not null and (
    auth.uid()::text = any(participants) or 
    public.is_campus_admin(auth.uid()::text)
  )
);

create policy "Conversations Delete Policy" on public.conversations for delete
using (
  auth.uid() is not null and (
    auth.uid()::text = any(participants) or 
    public.is_campus_admin(auth.uid()::text)
  )
);

-- 9.24 MESSAGES
create policy "Messages Select Policy" on public.messages for select
using (
  auth.uid() is not null and (
    exists (
      select 1 from public.conversations c 
      where c.id = "conversationId" and auth.uid()::text = any(c.participants)
    ) or 
    public.is_campus_admin(auth.uid()::text)
  )
);

create policy "Messages Insert Policy" on public.messages for insert
with check (
  auth.uid() is not null and 
  "senderId" = auth.uid()::text and 
  exists (
    select 1 from public.conversations c 
    where c.id = "conversationId" and auth.uid()::text = any(c.participants)
  )
);

create policy "Messages Update Policy" on public.messages for update
using (
  auth.uid() is not null and (
    "senderId" = auth.uid()::text or 
    public.is_campus_admin(auth.uid()::text)
  )
)
with check (
  auth.uid() is not null and (
    "senderId" = auth.uid()::text or 
    public.is_campus_admin(auth.uid()::text)
  )
);

create policy "Messages Delete Policy" on public.messages for delete
using (
  auth.uid() is not null and (
    "senderId" = auth.uid()::text or 
    public.is_campus_admin(auth.uid()::text)
  )
);

-- 9.25 CAMPUS REPORTS
create policy "Reports Select Policy" on public.reports for select
using (
  auth.uid() is not null and (
    "reportedBy" = auth.uid()::text or 
    public.is_campus_admin(auth.uid()::text)
  )
);

create policy "Reports Insert Policy" on public.reports for insert
with check (
  auth.uid() is not null and "reportedBy" = auth.uid()::text
);

create policy "Reports Update Policy" on public.reports for update
using (
  auth.uid() is not null and public.is_campus_admin(auth.uid()::text)
)
with check (
  auth.uid() is not null and public.is_campus_admin(auth.uid()::text)
);

create policy "Reports Delete Policy" on public.reports for delete
using (
  auth.uid() is not null and public.is_campus_admin(auth.uid()::text)
);

-- 9.26 ASSIGNMENTS
create policy "Assignments Select Policy" on public.assignments for select
using (true);

create policy "Assignments Insert Policy" on public.assignments for insert
with check (
  auth.uid() is not null and public.is_campus_faculty(auth.uid()::text)
);

create policy "Assignments Update Policy" on public.assignments for update
using (
  auth.uid() is not null and public.is_campus_faculty(auth.uid()::text)
)
with check (
  auth.uid() is not null and public.is_campus_faculty(auth.uid()::text)
);

create policy "Assignments Delete Policy" on public.assignments for delete
using (
  auth.uid() is not null and public.is_campus_faculty(auth.uid()::text)
);

-- ==========================================================
-- 10. Enable Supabase Realtime (WebSocket Streaming)
-- ==========================================================
do $$
begin
  -- General app tables
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'posts') then
    alter publication supabase_realtime add table public.posts;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'comments') then
    alter publication supabase_realtime add table public.comments;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversations') then
    alter publication supabase_realtime add table public.conversations;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'connections') then
    alter publication supabase_realtime add table public.connections;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;

  -- Community System Realtime Tables
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'communities') then
    alter publication supabase_realtime add table public.communities;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'community_members') then
    alter publication supabase_realtime add table public.community_members;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'community_posts') then
    alter publication supabase_realtime add table public.community_posts;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'community_comments') then
    alter publication supabase_realtime add table public.community_comments;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'community_discussions') then
    alter publication supabase_realtime add table public.community_discussions;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'community_discussion_comments') then
    alter publication supabase_realtime add table public.community_discussion_comments;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'community_messages') then
    alter publication supabase_realtime add table public.community_messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'community_resources') then
    alter publication supabase_realtime add table public.community_resources;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'community_events') then
    alter publication supabase_realtime add table public.community_events;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'community_reports') then
    alter publication supabase_realtime add table public.community_reports;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'community_moderation_actions') then
    alter publication supabase_realtime add table public.community_moderation_actions;
  end if;
end $$;

-- ==========================================================
-- 11. Supabase Storage RLS & Access Policies
-- ==========================================================
-- Ensure storage bucket exists
insert into storage.buckets (id, name, public)
values ('campusconnect', 'campusconnect', true)
on conflict (id) do update set public = true;

-- Drop prior storage policies if any
drop policy if exists "Public and Member Storage Read Policy" on storage.objects;
drop policy if exists "Authenticated User Upload Policy" on storage.objects;
drop policy if exists "Owner and Admin Delete Storage Policy" on storage.objects;

-- 11.1 READ (SELECT) Storage Objects Policy
create policy "Public and Member Storage Read Policy" on storage.objects for select
using (
  bucket_id = 'campusconnect' and (
    -- General public folders
    (storage.foldername(name))[1] in ('avatars', 'covers', 'posts', 'assignments', 'materials')
    -- Community public media (logos & covers)
    or ((storage.foldername(name))[1] = 'communities' and (storage.foldername(name))[2] in ('logos', 'covers'))
    -- Community posts / chat / resources check access
    or (
      (storage.foldername(name))[1] = 'communities'
      and public.can_access_community((storage.foldername(name))[2], auth.uid()::text)
    )
  )
);

-- 11.2 INSERT (Upload) Storage Objects Policy
create policy "Authenticated User Upload Policy" on storage.objects for insert
with check (
  bucket_id = 'campusconnect'
  and auth.uid() is not null
  and (
    -- User uploads to general folders
    (storage.foldername(name))[1] in ('avatars', 'covers', 'posts', 'assignments', 'materials')
    -- User uploading community logos/covers during creation
    or ((storage.foldername(name))[1] = 'communities' and (storage.foldername(name))[2] in ('logos', 'covers'))
    -- User uploading to a specific community where they are authorized
    or (
      (storage.foldername(name))[1] = 'communities'
      and public.can_access_community((storage.foldername(name))[2], auth.uid()::text)
    )
  )
);

-- 11.3 DELETE Storage Objects Policy
create policy "Owner and Admin Delete Storage Policy" on storage.objects for delete
using (
  bucket_id = 'campusconnect'
  and auth.uid() is not null
  and (
    owner = auth.uid()
    or public.is_campus_admin(auth.uid()::text)
    or (
      (storage.foldername(name))[1] = 'communities'
      and public.has_community_role_rank((storage.foldername(name))[2], auth.uid()::text, 'admin')
    )
  )
);
