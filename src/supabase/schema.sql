-- ==========================================================
-- EATM CampusConnect - Complete PostgreSQL Database Schema
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
-- ==========================================================

-- 1. Create Public Storage Bucket for Campus Uploads
insert into storage.buckets (id, name, public)
values ('campus-uploads', 'campus-uploads', true)
on conflict (id) do update set public = true;

-- Drop previous policies if they exist
drop policy if exists "Public Access to campus-uploads" on storage.objects;
drop policy if exists "Allow Uploads to campus-uploads" on storage.objects;
drop policy if exists "Allow all operations on campus-uploads" on storage.objects;

-- Allow all operations (select, insert, update, delete) on campus-uploads
create policy "Allow all operations on campus-uploads"
on storage.objects for all
using (bucket_id = 'campus-uploads')
with check (bucket_id = 'campus-uploads');

-- 2. Users Table
create table if not exists public.users (
  id text primary key,
  uid text,
  email text not null,
  "displayName" text not null,
  role text not null default 'student',
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
  status text default 'active',
  verified boolean default false,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

-- 3. Posts Table
create table if not exists public.posts (
  id text primary key,
  "authorId" text not null,
  "authorName" text not null,
  "authorAvatar" text,
  "authorRole" text not null default 'student',
  "authorDept" text,
  content text not null,
  "mediaUrl" text,
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

-- 4. Comments Table
create table if not exists public.comments (
  id text primary key,
  "postId" text not null references public.posts(id) on delete cascade,
  "authorId" text not null,
  "authorName" text not null,
  "authorAvatar" text,
  content text not null,
  "createdAt" timestamptz default now()
);

-- 5. Communities / Clubs Table
create table if not exists public.communities (
  id text primary key,
  name text not null,
  description text not null,
  category text not null,
  logo text,
  cover text,
  lead text,
  "leadRole" text,
  "memberCount" int default 1,
  members text[] default '{}',
  admins text[] default '{}',
  tags text[] default '{}',
  "meetingTime" text,
  room text,
  "createdAt" timestamptz default now()
);

-- 6. Events Table
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

-- 7. Study Materials Table
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

-- 8. Opportunities Table
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

-- 9. Announcements Table
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

-- 10. Notifications Table
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

-- 11. Connections Table
create table if not exists public.connections (
  id text primary key,
  "requesterId" text not null,
  "recipientId" text not null,
  status text not null default 'pending',
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

-- 12. Conversations & Messages
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

-- Ensure existing installations have all columns
alter table public.conversations add column if not exists "isGroup" boolean default false;
alter table public.conversations add column if not exists "groupName" text;
alter table public.conversations add column if not exists "groupAvatar" text;
alter table public.conversations add column if not exists "participantDetails" jsonb default '{}';
alter table public.conversations add column if not exists "unreadCount" jsonb default '{}';

create table if not exists public.messages (
  id text primary key,
  "conversationId" text not null references public.conversations(id) on delete cascade,
  "senderId" text not null,
  "senderName" text,
  "senderAvatar" text,
  text text,
  "mediaUrl" text,
  read boolean default false,
  "createdAt" timestamptz default now()
);

-- Ensure existing messages installations have sender metadata and media columns
alter table public.messages add column if not exists "senderName" text;
alter table public.messages add column if not exists "senderAvatar" text;
alter table public.messages add column if not exists "mediaType" text;
alter table public.messages add column if not exists "fileName" text;
alter table public.messages add column if not exists "fileSize" text;
alter table public.messages add column if not exists "audioDuration" numeric;

-- 13. Reports Table
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

-- 14. Assignments Table
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

-- Enable Row Level Security (RLS) on all tables
alter table public.users enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.communities enable row level security;
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

-- Create Open Access Policies for rapid student prototype and live campus operations
create policy "Allow all operations for authenticated and anonymous users" on public.users for all using (true) with check (true);
create policy "Allow all operations on posts" on public.posts for all using (true) with check (true);
create policy "Allow all operations on comments" on public.comments for all using (true) with check (true);
create policy "Allow all operations on communities" on public.communities for all using (true) with check (true);
create policy "Allow all operations on events" on public.events for all using (true) with check (true);
create policy "Allow all operations on study_materials" on public.study_materials for all using (true) with check (true);
create policy "Allow all operations on opportunities" on public.opportunities for all using (true) with check (true);
create policy "Allow all operations on announcements" on public.announcements for all using (true) with check (true);
create policy "Allow all operations on notifications" on public.notifications for all using (true) with check (true);
create policy "Allow all operations on connections" on public.connections for all using (true) with check (true);
create policy "Allow all operations on conversations" on public.conversations for all using (true) with check (true);
create policy "Allow all operations on messages" on public.messages for all using (true) with check (true);
create policy "Allow all operations on reports" on public.reports for all using (true) with check (true);
create policy "Allow all operations on assignments" on public.assignments for all using (true) with check (true);

-- ==========================================================
-- 14. Enable Supabase Realtime (100% Free Tier)
-- Allows live WebSocket streaming for Posts, Comments, Messages, Connections, Notifications
-- ==========================================================
do $$
begin
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
end $$;

