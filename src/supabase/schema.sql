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

-- Ensure mediaUrls column exists for multi-image carousel posts
alter table public.posts add column if not exists "mediaUrls" text[] default '{}';

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

-- 5. Communities / Clubs & Student Societies Table
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

-- 5.1 Community Memberships Table (Single Source of Truth for Member Roles & Status)
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

-- 5.2 Community Posts Table
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

-- 5.3 Community Comments Table
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

-- 5.4 Community Discussions Table
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

-- 5.5 Community Discussion Comments Table
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

-- 5.6 Community Live Messages (Group Chat)
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

-- 5.7 Community Resources & Study Docs
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

-- 5.8 Community Events Table
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

-- 5.9 Community Event RSVPs Table
create table if not exists public.community_event_rsvps (
  id text primary key,
  "eventId" text not null references public.community_events(id) on delete cascade,
  "communityId" text not null references public.communities(id) on delete cascade,
  "userId" text not null references public.users(id) on delete cascade,
  status text not null default 'going', -- 'going' | 'interested' | 'not_going'
  "createdAt" timestamptz default now(),
  unique("eventId", "userId")
);

-- 5.10 Community Poll Votes Table
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

-- 5.11 Community Reports & Moderation Queue
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

-- 5.12 Community Moderation Actions & Audit Log
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
alter table public.messages add column if not exists "isDeleted" boolean default false;
alter table public.messages add column if not exists "deletedFor" text[] default '{}';

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
-- 14. Community Role Hierarchy & RLS Helper Functions
-- Hierarchy: OWNER (rank 4) > ADMIN (rank 3) > MODERATOR (rank 2) > MEMBER (rank 1)
-- ==========================================================

-- Helper: Retrieve approved role of a user in a community
create or replace function public.get_community_role(comm_id text, usr_id text)
returns text language sql stable security definer as $$
  select role from public.community_members
  where "communityId" = comm_id and "userId" = usr_id and status = 'approved'
  limit 1;
$$;

-- Helper: Check if user meets minimum role rank in community
create or replace function public.has_community_role_rank(comm_id text, usr_id text, min_role text)
returns boolean language plpgsql stable security definer as $$
declare
  user_role text;
  user_rank int := 0;
  required_rank int := 0;
begin
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

-- Helper: Check if community is public or user is an approved member
create or replace function public.can_access_community(comm_id text, usr_id text)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.communities where id = comm_id and type = 'public'
    union
    select 1 from public.community_members where "communityId" = comm_id and "userId" = usr_id and status = 'approved'
    union
    select 1 from public.communities where id = comm_id and "ownerId" = usr_id
  );
$$;

-- Policies for CampusConnect Client Operations
create policy "Allow all operations for authenticated and anonymous users" on public.users for all using (true) with check (true);
create policy "Allow all operations on posts" on public.posts for all using (true) with check (true);
create policy "Allow all operations on comments" on public.comments for all using (true) with check (true);
create policy "Allow all operations on communities" on public.communities for all using (true) with check (true);
create policy "Allow all operations on community_members" on public.community_members for all using (true) with check (true);
create policy "Allow all operations on community_posts" on public.community_posts for all using (true) with check (true);
create policy "Allow all operations on community_comments" on public.community_comments for all using (true) with check (true);
create policy "Allow all operations on community_discussions" on public.community_discussions for all using (true) with check (true);
create policy "Allow all operations on community_discussion_comments" on public.community_discussion_comments for all using (true) with check (true);
create policy "Allow all operations on community_messages" on public.community_messages for all using (true) with check (true);
create policy "Allow all operations on community_resources" on public.community_resources for all using (true) with check (true);
create policy "Allow all operations on community_events" on public.community_events for all using (true) with check (true);
create policy "Allow all operations on community_event_rsvps" on public.community_event_rsvps for all using (true) with check (true);
create policy "Allow all operations on community_poll_votes" on public.community_poll_votes for all using (true) with check (true);
create policy "Allow all operations on community_reports" on public.community_reports for all using (true) with check (true);
create policy "Allow all operations on community_moderation_actions" on public.community_moderation_actions for all using (true) with check (true);
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
-- 15. Enable Supabase Realtime (100% Free Tier)
-- Allows live WebSocket streaming across multi-browsers/devices
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

