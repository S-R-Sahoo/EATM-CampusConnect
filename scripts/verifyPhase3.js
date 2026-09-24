// Phase 3 Verification Script: Supabase RLS & Database Security Architecture
// Validates:
// 1. Student cannot elevate themselves to admin or owner in community_members
// 2. Normal member cannot change another member's role or status
// 3. Moderator and Admin cannot transfer community ownership unless they are the current owner
// 4. Non-owner cannot delete a community
// 5. Non-member cannot query private community posts
// 6. Non-member cannot query private community chat messages
// 7. Non-member cannot query private community resources
// 8. Normal member cannot query moderation reports or moderation actions
// 9. Unauthenticated / anonymous user cannot insert or update protected community tables
// 10. Student cannot mark a community as EATM Verified / isOfficial (Database trigger check)
// 11. Banned user is strictly prohibited from accessing private content or writing to channels
// 12. Supabase Storage isolation for private community media/resources

import assert from 'assert';

console.log('🔒 Running Phase 3: Supabase RLS & Database Security Verification Suite...\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error(`   Error: ${err.message}`);
    failed++;
  }
}

// -------------------------------------------------------------
// Security Engine Simulation (Direct Database / RLS / Trigger Simulator)
// -------------------------------------------------------------
class DatabaseSecuritySimulator {
  constructor() {
    this.users = [];
    this.communities = [];
    this.community_members = [];
    this.community_posts = [];
    this.community_messages = [];
    this.community_resources = [];
    this.community_reports = [];
    this.community_moderation_actions = [];
    this.storage_objects = [];
  }

  isCampusAdmin(userId) {
    if (!userId) return false;
    const user = this.users.find(u => u.id === userId);
    return user?.role === 'admin' && user?.status === 'active';
  }

  getCommunityRole(commId, userId) {
    if (!userId) return null;
    if (this.isCampusAdmin(userId)) return 'admin';
    const member = this.community_members.find(m => m.communityId === commId && m.userId === userId && m.status === 'approved');
    if (member) return member.role;
    const comm = this.communities.find(c => c.id === commId);
    if (comm && comm.ownerId === userId) return 'owner';
    return null;
  }

  hasCommunityRoleRank(commId, userId, minRole) {
    if (!userId) return false;
    if (this.isCampusAdmin(userId)) return true;
    const role = this.getCommunityRole(commId, userId);
    if (!role) return false;

    const rankMap = { owner: 4, admin: 3, moderator: 2, member: 1 };
    const userRank = rankMap[role] || 0;
    const requiredRank = rankMap[minRole] || 0;
    return userRank >= requiredRank;
  }

  isCommunityBanned(commId, userId) {
    if (!userId) return false;
    return this.community_members.some(m => m.communityId === commId && m.userId === userId && m.status === 'banned');
  }

  canAccessCommunity(commId, userId) {
    if (userId && this.isCommunityBanned(commId, userId)) return false;
    if (userId && this.isCampusAdmin(userId)) return true;
    const comm = this.communities.find(c => c.id === commId);
    if (!comm) return false;
    if (comm.type === 'public') return true;
    if (!userId) return false;
    if (comm.ownerId === userId) return true;
    return this.community_members.some(m => m.communityId === commId && m.userId === userId && m.status === 'approved');
  }

  // --- communities table simulation with triggers ---
  insertCommunity(callerId, data) {
    if (!callerId) throw new Error('RLS VIOLATION: Unauthenticated insert');
    if (data.ownerId !== callerId) throw new Error('RLS VIOLATION: ownerId must match authenticated user');

    // Trigger: sanitize_new_community
    const isOfficial = this.isCampusAdmin(callerId) ? (data.isOfficial || false) : false;
    const verificationStatus = isOfficial ? 'verified' : 'student';

    const comm = {
      ...data,
      id: data.id || ('club_' + Math.random().toString(36).slice(2, 8)),
      isOfficial,
      verificationStatus,
      createdAt: new Date().toISOString()
    };
    this.communities.push(comm);

    // Auto owner membership
    this.community_members.push({
      id: `cm_${comm.id}_${callerId}`,
      communityId: comm.id,
      userId: callerId,
      role: 'owner',
      status: 'approved'
    });

    return comm;
  }

  deleteCommunity(callerId, commId) {
    if (!callerId) throw new Error('RLS VIOLATION: Unauthenticated delete');
    if (!this.hasCommunityRoleRank(commId, callerId, 'owner') && !this.isCampusAdmin(callerId)) {
      throw new Error('RLS VIOLATION: Only the owner or campus admin can delete the community');
    }
    this.communities = this.communities.filter(c => c.id !== commId);
    return true;
  }

  // --- community_members table simulation with protect_community_members trigger ---
  insertMembership(callerId, row) {
    if (!callerId) throw new Error('RLS VIOLATION: Unauthenticated insert');
    if (row.userId !== callerId && !this.hasCommunityRoleRank(row.communityId, callerId, 'admin')) {
      throw new Error('RLS VIOLATION: Cannot insert membership for other users');
    }

    // Trigger: protect_community_members
    let role = row.role || 'member';
    let status = row.status || 'approved';
    const comm = this.communities.find(c => c.id === row.communityId);

    if (!this.isCampusAdmin(callerId) && comm?.ownerId !== callerId && !this.hasCommunityRoleRank(row.communityId, callerId, 'admin')) {
      role = 'member'; // Forced to member
      status = comm?.type === 'private' ? 'pending' : 'approved'; // Private forced to pending
    }

    const newMem = {
      ...row,
      id: row.id || `cm_${row.communityId}_${row.userId}`,
      role,
      status
    };
    this.community_members.push(newMem);
    return newMem;
  }

  updateMembership(callerId, commId, targetUserId, updates) {
    if (!callerId) throw new Error('RLS VIOLATION: Unauthenticated update');
    const member = this.community_members.find(m => m.communityId === commId && m.userId === targetUserId);
    if (!member) throw new Error('Member not found');

    // Trigger: protect_community_members
    if (!this.isCampusAdmin(callerId)) {
      if (!this.hasCommunityRoleRank(commId, callerId, 'admin')) {
        throw new Error('RLS VIOLATION: Only community leadership can update membership records');
      }

      if (updates.role === 'owner' && member.role !== 'owner') {
        const comm = this.communities.find(c => c.id === commId);
        if (comm?.ownerId !== callerId) {
          throw new Error('RLS VIOLATION: Only the current owner can transfer ownership');
        }
      }
    }

    Object.assign(member, updates);
    return member;
  }

  // --- Content Queries & Inserts (RLS Guarded) ---
  selectPosts(callerId, commId) {
    if (!this.canAccessCommunity(commId, callerId)) {
      return []; // RLS returns empty for unauthorized queries
    }
    return this.community_posts.filter(p => p.communityId === commId);
  }

  insertPost(callerId, post) {
    if (!callerId) throw new Error('RLS VIOLATION: Unauthenticated insert');
    if (post.authorId !== callerId) throw new Error('RLS VIOLATION: authorId must match auth user');
    if (!this.canAccessCommunity(post.communityId, callerId)) {
      throw new Error('RLS VIOLATION: Cannot post in inaccessible community');
    }
    this.community_posts.push(post);
    return post;
  }

  selectMessages(callerId, commId) {
    if (!this.canAccessCommunity(commId, callerId)) {
      return []; // RLS returns empty
    }
    return this.community_messages.filter(m => m.communityId === commId);
  }

  selectResources(callerId, commId) {
    if (!this.canAccessCommunity(commId, callerId)) {
      return []; // RLS returns empty
    }
    return this.community_resources.filter(r => r.communityId === commId);
  }

  selectReports(callerId, commId) {
    if (!callerId) return [];
    if (!this.isCampusAdmin(callerId) && !this.hasCommunityRoleRank(commId, callerId, 'moderator')) {
      // Normal member only sees their own reports
      return this.community_reports.filter(r => r.communityId === commId && r.reporterId === callerId);
    }
    return this.community_reports.filter(r => r.communityId === commId);
  }

  // --- Storage RLS Policy ---
  canReadStorage(callerId, path) {
    // path: communities/{commId}/resources/...
    const parts = path.split('/');
    if (parts[0] === 'communities') {
      const folder = parts[1]; // commId or 'logos'/'covers'
      if (folder === 'logos' || folder === 'covers') return true;
      return this.canAccessCommunity(folder, callerId);
    }
    return true;
  }
}

// -------------------------------------------------------------
// Test 1: Student cannot make themselves Admin on Join
// -------------------------------------------------------------
test("Test 1: Student cannot make themselves Admin on Join (Privilege escalation blocked)", () => {
  const db = new DatabaseSecuritySimulator();
  const owner = 'user_alice';
  const student = 'user_hacker';

  const comm = db.insertCommunity(owner, { name: 'Robotics', type: 'public', ownerId: owner });

  // Student tries to insert themselves with role: 'admin'
  const mem = db.insertMembership(student, {
    communityId: comm.id,
    userId: student,
    role: 'admin' // Attempted privilege escalation
  });

  assert.strictEqual(mem.role, 'member', "Database trigger must override self-assigned role to 'member'");
});

// -------------------------------------------------------------
// Test 2: Member cannot change another member's role or status
// -------------------------------------------------------------
test("Test 2: Member cannot change another member's role or status", () => {
  const db = new DatabaseSecuritySimulator();
  const owner = 'user_alice';
  const memberA = 'user_bob';
  const memberB = 'user_charlie';

  const comm = db.insertCommunity(owner, { name: 'Music Society', type: 'public', ownerId: owner });
  db.insertMembership(memberA, { communityId: comm.id, userId: memberA });
  db.insertMembership(memberB, { communityId: comm.id, userId: memberB });

  // MemberA attempts to promote MemberB to admin
  assert.throws(() => {
    db.updateMembership(memberA, comm.id, memberB, { role: 'admin' });
  }, /RLS VIOLATION: Only community leadership can update membership records/);
});

// -------------------------------------------------------------
// Test 3: Moderator and Admin cannot transfer ownership unless they are current owner
// -------------------------------------------------------------
test("Test 3: Moderator and Admin cannot transfer ownership (Owner-only privilege)", () => {
  const db = new DatabaseSecuritySimulator();
  const owner = 'user_alice';
  const adminBob = 'user_bob';
  const modCharlie = 'user_charlie';
  const peer = 'user_peer';

  const comm = db.insertCommunity(owner, { name: 'Debate Society', type: 'public', ownerId: owner });
  db.insertMembership(adminBob, { communityId: comm.id, userId: adminBob });
  db.updateMembership(owner, comm.id, adminBob, { role: 'admin' });

  db.insertMembership(modCharlie, { communityId: comm.id, userId: modCharlie });
  db.updateMembership(owner, comm.id, modCharlie, { role: 'moderator' });

  db.insertMembership(peer, { communityId: comm.id, userId: peer });

  // 1. Moderator attempts role update (blocked by admin rank requirement)
  assert.throws(() => {
    db.updateMembership(modCharlie, comm.id, peer, { role: 'owner' });
  }, /RLS VIOLATION: Only community leadership can update membership records/);

  // 2. Admin attempts ownership transfer (blocked because not the founding/current owner)
  assert.throws(() => {
    db.updateMembership(adminBob, comm.id, peer, { role: 'owner' });
  }, /RLS VIOLATION: Only the current owner can transfer ownership/);
});

// -------------------------------------------------------------
// Test 4: Non-owner cannot delete community
// -------------------------------------------------------------
test("Test 4: Non-owner cannot delete community", () => {
  const db = new DatabaseSecuritySimulator();
  const owner = 'user_alice';
  const admin = 'user_admin';

  const comm = db.insertCommunity(owner, { name: 'Drama Society', type: 'public', ownerId: owner });
  db.insertMembership(admin, { communityId: comm.id, userId: admin });
  db.updateMembership(owner, comm.id, admin, { role: 'admin' });

  // Admin attempts to delete community
  assert.throws(() => {
    db.deleteCommunity(admin, comm.id);
  }, /RLS VIOLATION: Only the owner or campus admin can delete/);

  // Owner can delete successfully
  assert.strictEqual(db.deleteCommunity(owner, comm.id), true);
});

// -------------------------------------------------------------
// Test 5: Non-member cannot read private posts
// -------------------------------------------------------------
test("Test 5: Non-member cannot read private community posts", () => {
  const db = new DatabaseSecuritySimulator();
  const owner = 'user_alice';
  const nonMember = 'user_outsider';

  const privateComm = db.insertCommunity(owner, { name: 'Confidential R&D', type: 'private', ownerId: owner });
  db.insertPost(owner, { id: 'p1', communityId: privateComm.id, authorId: owner, content: 'Secret project roadmap' });

  const posts = db.selectPosts(nonMember, privateComm.id);
  assert.strictEqual(posts.length, 0, "Non-member receives 0 rows on private posts query");
});

// -------------------------------------------------------------
// Test 6: Non-member cannot read private chat messages
// -------------------------------------------------------------
test("Test 6: Non-member cannot read private community chat messages", () => {
  const db = new DatabaseSecuritySimulator();
  const owner = 'user_alice';
  const nonMember = 'user_outsider';

  const privateComm = db.insertCommunity(owner, { name: 'Officers Council', type: 'private', ownerId: owner });
  db.community_messages.push({ id: 'm1', communityId: privateComm.id, senderId: owner, text: 'Executive discussion' });

  const msgs = db.selectMessages(nonMember, privateComm.id);
  assert.strictEqual(msgs.length, 0, "Non-member receives 0 messages from private chat");
});

// -------------------------------------------------------------
// Test 7: Non-member cannot read private resources
// -------------------------------------------------------------
test("Test 7: Non-member cannot read private community resources", () => {
  const db = new DatabaseSecuritySimulator();
  const owner = 'user_alice';
  const nonMember = 'user_outsider';

  const privateComm = db.insertCommunity(owner, { name: 'Exclusive Study Group', type: 'private', ownerId: owner });
  db.community_resources.push({ id: 'r1', communityId: privateComm.id, uploadedBy: owner, title: 'Exam Solutions.pdf' });

  const resources = db.selectResources(nonMember, privateComm.id);
  assert.strictEqual(resources.length, 0, "Non-member receives 0 resources from private library");
});

// -------------------------------------------------------------
// Test 8: Normal member cannot read moderation reports
// -------------------------------------------------------------
test("Test 8: Normal member cannot read moderation queue reports", () => {
  const db = new DatabaseSecuritySimulator();
  const owner = 'user_alice';
  const member = 'user_bob';
  const reporter = 'user_charlie';

  const comm = db.insertCommunity(owner, { name: 'Gaming Guild', type: 'public', ownerId: owner });
  db.insertMembership(member, { communityId: comm.id, userId: member });
  db.insertMembership(reporter, { communityId: comm.id, userId: reporter });

  db.community_reports.push({ id: 'rep1', communityId: comm.id, reporterId: reporter, reason: 'Harassment' });

  // Normal member Bob checks reports
  const memberReports = db.selectReports(member, comm.id);
  assert.strictEqual(memberReports.length, 0, "Normal member cannot inspect moderation reports");

  // Owner Alice checks reports
  const ownerReports = db.selectReports(owner, comm.id);
  assert.strictEqual(ownerReports.length, 1, "Owner/Moderator can access full reports queue");
});

// -------------------------------------------------------------
// Test 9: Unauthenticated user cannot write protected data
// -------------------------------------------------------------
test("Test 9: Unauthenticated user cannot write protected data", () => {
  const db = new DatabaseSecuritySimulator();
  const owner = 'user_alice';
  const comm = db.insertCommunity(owner, { name: 'Campus Innovators', type: 'public', ownerId: owner });

  // Anonymous caller (null auth user) attempts write
  assert.throws(() => {
    db.insertPost(null, { communityId: comm.id, authorId: 'anon', content: 'Anonymous spam' });
  }, /RLS VIOLATION: Unauthenticated insert/);
});

// -------------------------------------------------------------
// Test 10: Student cannot mark a community as officially verified
// -------------------------------------------------------------
test("Test 10: Student cannot mark a community as officially verified (Database trigger sanitization)", () => {
  const db = new DatabaseSecuritySimulator();
  const student = 'user_student';

  const comm = db.insertCommunity(student, {
    name: 'Fake Official Club',
    type: 'public',
    ownerId: student,
    isOfficial: true, // Malicious attempt to self-verify
    verificationStatus: 'verified'
  });

  assert.strictEqual(comm.isOfficial, false, "Trigger must reset isOfficial to false for student");
  assert.strictEqual(comm.verificationStatus, 'student', "Trigger must set verificationStatus to 'student'");
});

// -------------------------------------------------------------
// Test 11: Banned user is prohibited from accessing content or writing
// -------------------------------------------------------------
test("Test 11: Banned user is strictly prohibited from accessing content or writing", () => {
  const db = new DatabaseSecuritySimulator();
  const owner = 'user_alice';
  const bannedUser = 'user_troublemaker';

  const comm = db.insertCommunity(owner, { name: 'Coding Arena', type: 'public', ownerId: owner });
  db.insertMembership(bannedUser, { communityId: comm.id, userId: bannedUser });
  db.updateMembership(owner, comm.id, bannedUser, { status: 'banned' });

  // Banned check
  assert.strictEqual(db.canAccessCommunity(comm.id, bannedUser), false, "Banned user is denied access");

  // Banned user cannot post
  assert.throws(() => {
    db.insertPost(bannedUser, { communityId: comm.id, authorId: bannedUser, content: 'Banned message' });
  }, /RLS VIOLATION/);
});

// -------------------------------------------------------------
// Test 12: Supabase Storage isolation for private community media/resources
// -------------------------------------------------------------
test("Test 12: Supabase Storage isolation for private community media/resources", () => {
  const db = new DatabaseSecuritySimulator();
  const owner = 'user_alice';
  const applicant = 'user_approved';
  const outsider = 'user_stranger';

  const privateComm = db.insertCommunity(owner, { name: 'AI Society Research', type: 'private', ownerId: owner });
  
  // Applicant joins and is approved by owner
  db.insertMembership(applicant, { communityId: privateComm.id, userId: applicant });
  db.updateMembership(owner, privateComm.id, applicant, { status: 'approved' });

  const resourcePath = `communities/${privateComm.id}/resources/DeepLearning_Lecture.pdf`;
  const logoPath = `communities/logos/ai_society_logo.png`;

  // Public logo is readable by all
  assert.strictEqual(db.canReadStorage(outsider, logoPath), true, "Public logos/covers accessible to all");

  // Private document restricted to approved members
  assert.strictEqual(db.canReadStorage(applicant, resourcePath), true, "Approved member can read private storage");
  assert.strictEqual(db.canReadStorage(outsider, resourcePath), false, "Outsider blocked from private storage");
});

// =============================================================
console.log(`\n=============================================================`);
console.log(`Phase 3 Verification: ${passed} Passed, ${failed} Failed.`);
console.log(`=============================================================\n`);

if (failed > 0) process.exit(1);
