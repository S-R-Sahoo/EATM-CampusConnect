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

-- Ensure settings and columns exist
alter table public.users add column if not exists settings jsonb default '{}';
alter table public.users add column if not exists "socialLinks" jsonb default '{}';

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

-- 4.6 Connections Table
create table if not exists public.connections (
  id text primary key,
  "requesterId" text not null,
  "recipientId" text not null,
  status text not null default 'pending', -- 'pending' | 'accepted' | 'rejected'
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

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
    -- If a non-admin is inserting their own row (joining), force role to 'member'
    -- unless they are creating a new community (matching ownerId in communities)
    if not exists (select 1 from public.communities where id = NEW."communityId" and "ownerId" = caller_id) then
      if not public.has_community_role_rank(NEW."communityId", caller_id, 'admin') then
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
  auth.uid() is not null and (
    auth.uid()::text = id or 
    auth.uid()::text = uid or 
    public.is_campus_admin(auth.uid()::text)
  )
);

create policy "Users Update Policy" on public.users for update
using (
  auth.uid() is not null and (
    auth.uid()::text = id or 
    auth.uid()::text = uid or 
    public.is_campus_admin(auth.uid()::text)
  )
)
with check (
  auth.uid() is not null and (
    auth.uid()::text = id or 
    auth.uid()::text = uid or 
    public.is_campus_admin(auth.uid()::text)
  )
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
  auth.uid() is not null and "ownerId" = auth.uid()::text
);

create policy "Communities Update Policy" on public.communities for update
using (
  auth.uid() is not null and (
    public.has_community_role_rank(id, auth.uid()::text, 'admin') or 
    public.is_campus_admin(auth.uid()::text)
  )
)
with check (
  auth.uid() is not null and (
    public.has_community_role_rank(id, auth.uid()::text, 'admin') or 
    public.is_campus_admin(auth.uid()::text)
  )
);

create policy "Communities Delete Policy" on public.communities for delete
using (
  auth.uid() is not null and (
    public.has_community_role_rank(id, auth.uid()::text, 'owner') or 
    public.is_campus_admin(auth.uid()::text)
  )
);

-- 9.5 COMMUNITY MEMBERSHIPS (Single Source of Truth)
create policy "Community Members Select Policy" on public.community_members for select
using (
  public.can_access_community("communityId", auth.uid()::text) or 
  "userId" = auth.uid()::text or 
  role in ('owner', 'admin')
);

create policy "Community Members Insert Policy" on public.community_members for insert
with check (
  auth.uid() is not null and (
    "userId" = auth.uid()::text or 
    public.has_community_role_rank("communityId", auth.uid()::text, 'admin') or 
    public.is_campus_admin(auth.uid()::text)
  )
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
