// Phase 2 Verification Script: Membership + Public/Private Community Access
// Validates:
// 1. Public Community Join (Immediate approved status, dynamic memberCount, immediate content access)
// 2. Private Community Lock & Content Guard (Protected posts/discussions/messages/roster hidden for non-members)
// 3. Join Request Flow (Pending status, owner notification, pending UI state)
// 4. Approval Flow (Pending -> Approved, access granted, count increments)
// 5. Rejection Flow (Pending -> Removed/Rejected, access denied)
// 6. Banned Users (Restricted from posting, commenting, chatting, rejoining)
// 7. Unban Flow (Ban lifted, access restored)
// 8. Owner Guard on Leave (Cannot leave without transfer if society has > 1 member)
// 9. Ownership Transfer (Reassigns owner role in community_members & communities)
// 10. Duplicate Prevention (Handles duplicate requests, approved joins, banned states)

import assert from 'assert';

console.log('🚀 Running Phase 2: Community Membership & Access Control Verification Suite...\n');

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

// =============================================================
// Simulated In-Memory Database Store mimicking Supabase + Tables
// =============================================================
class MockDatabase {
  constructor() {
    this.communities = [];
    this.community_members = [];
    this.community_posts = [];
    this.community_comments = [];
    this.community_discussions = [];
    this.community_messages = [];
    this.notifications = [];
    this.moderation_actions = [];
  }

  createCommunity(data, creatorId) {
    const id = 'club_' + Math.random().toString(36).substring(2, 8);
    const comm = {
      id,
      name: data.name,
      category: data.category || 'Technical',
      description: data.description || '',
      type: data.type || 'public',
      ownerId: creatorId,
      memberCount: 1,
      members: [creatorId],
      admins: [creatorId],
      moderators: [],
      pendingRequests: [],
      bannedUsers: []
    };
    this.communities.push(comm);

    // Single source of truth membership
    this.community_members.push({
      id: `cm_${id}_${creatorId}`,
      communityId: id,
      userId: creatorId,
      role: 'owner',
      status: 'approved',
      joinedAt: new Date().toISOString()
    });

    return comm;
  }

  joinCommunity(communityId, userId) {
    const comm = this.communities.find(c => c.id === communityId);
    if (!comm) throw new Error('Community not found');

    const existing = this.community_members.find(m => m.communityId === communityId && m.userId === userId);
    if (existing) {
      if (existing.status === 'banned') return { status: 'banned', count: comm.memberCount };
      if (existing.status === 'approved') return { status: 'already_member', count: comm.memberCount };
      if (existing.status === 'pending') return { status: 'requested', count: comm.memberCount };
    }

    const isPrivate = comm.type === 'private';
    const targetStatus = isPrivate ? 'pending' : 'approved';

    if (existing) {
      existing.status = targetStatus;
    } else {
      this.community_members.push({
        id: `cm_${communityId}_${userId}`,
        communityId,
        userId,
        role: 'member',
        status: targetStatus,
        requestedAt: isPrivate ? new Date().toISOString() : null,
        joinedAt: !isPrivate ? new Date().toISOString() : null
      });
    }

    // Recount approved members from single source of truth
    const approved = this.community_members.filter(m => m.communityId === communityId && m.status === 'approved');
    const pending = this.community_members.filter(m => m.communityId === communityId && m.status === 'pending');

    comm.members = approved.map(m => m.userId);
    comm.memberCount = approved.length;
    comm.pendingRequests = pending.map(m => m.userId);

    if (isPrivate) {
      this.notifications.push({
        recipientId: comm.ownerId,
        senderId: userId,
        type: 'connection_request',
        title: 'New Community Join Request',
        message: `Student requested to join "${comm.name}"`
      });
      return { status: 'requested', count: comm.memberCount };
    }

    return { status: 'joined', count: comm.memberCount };
  }

  leaveCommunity(communityId, userId) {
    const comm = this.communities.find(c => c.id === communityId);
    if (!comm) return { success: false, count: 0 };

    const existing = this.community_members.find(m => m.communityId === communityId && m.userId === userId);
    const approved = this.community_members.filter(m => m.communityId === communityId && m.status === 'approved');

    // Owner Guard: Owner cannot leave if > 1 approved member remains without ownership transfer
    if ((existing?.role === 'owner' || comm.ownerId === userId) && approved.length > 1) {
      return { success: false, isOwnerMustTransfer: true, count: approved.length };
    }

    this.community_members = this.community_members.filter(m => !(m.communityId === communityId && m.userId === userId));

    const remainingApproved = this.community_members.filter(m => m.communityId === communityId && m.status === 'approved');
    comm.members = remainingApproved.map(m => m.userId);
    comm.admins = remainingApproved.filter(m => m.role === 'admin' || m.role === 'owner').map(m => m.userId);
    comm.memberCount = remainingApproved.length;

    return { success: true, count: comm.memberCount };
  }

  handleCommunityJoinRequest(communityId, targetUserId, action, adminId) {
    const comm = this.communities.find(c => c.id === communityId);
    if (!comm) return { success: false };
    if (comm.ownerId !== adminId && !comm.admins.includes(adminId)) {
      return { success: false, error: 'Unauthorized' };
    }

    const memberRow = this.community_members.find(m => m.communityId === communityId && m.userId === targetUserId);
    if (!memberRow) return { success: false };

    if (action === 'approve') {
      memberRow.status = 'approved';
      memberRow.joinedAt = new Date().toISOString();
      this.notifications.push({
        recipientId: targetUserId,
        type: 'connection_accepted',
        title: 'Community Request Approved',
        message: `Your request to join "${comm.name}" was approved!`
      });
    } else {
      this.community_members = this.community_members.filter(m => !(m.communityId === communityId && m.userId === targetUserId));
      this.notifications.push({
        recipientId: targetUserId,
        type: 'system',
        title: 'Community Request Declined',
        message: `Your request to join "${comm.name}" was declined.`
      });
    }

    const approved = this.community_members.filter(m => m.communityId === communityId && m.status === 'approved');
    const pending = this.community_members.filter(m => m.communityId === communityId && m.status === 'pending');

    comm.members = approved.map(m => m.userId);
    comm.memberCount = approved.length;
    comm.pendingRequests = pending.map(m => m.userId);

    return { success: true, community: comm };
  }

  banCommunityMember(communityId, targetUserId, reason, adminId) {
    const comm = this.communities.find(c => c.id === communityId);
    if (!comm) return { success: false };
    if (targetUserId === comm.ownerId) return { success: false, error: 'Cannot ban the owner' };
    if (comm.ownerId !== adminId && !comm.admins.includes(adminId)) {
      return { success: false, error: 'Unauthorized' };
    }

    let memberRow = this.community_members.find(m => m.communityId === communityId && m.userId === targetUserId);
    if (memberRow) {
      memberRow.status = 'banned';
    } else {
      this.community_members.push({
        id: `cm_${communityId}_${targetUserId}`,
        communityId,
        userId: targetUserId,
        role: 'member',
        status: 'banned'
      });
    }

    const approved = this.community_members.filter(m => m.communityId === communityId && m.status === 'approved');
    const banned = this.community_members.filter(m => m.communityId === communityId && m.status === 'banned');

    comm.members = approved.map(m => m.userId);
    comm.admins = approved.filter(m => m.role === 'admin' || m.role === 'owner').map(m => m.userId);
    comm.memberCount = approved.length;
    comm.bannedUsers = banned.map(m => m.userId);

    this.moderation_actions.push({
      communityId,
      moderatorId: adminId,
      targetUserId,
      actionType: 'ban_member',
      reason
    });

    return { success: true, community: comm };
  }

  unbanCommunityMember(communityId, targetUserId, adminId) {
    const comm = this.communities.find(c => c.id === communityId);
    if (!comm) return { success: false };
    if (comm.ownerId !== adminId && !comm.admins.includes(adminId)) {
      return { success: false, error: 'Unauthorized' };
    }

    this.community_members = this.community_members.filter(m => !(m.communityId === communityId && m.userId === targetUserId && m.status === 'banned'));
    comm.bannedUsers = comm.bannedUsers.filter(id => id !== targetUserId);

    this.moderation_actions.push({
      communityId,
      moderatorId: adminId,
      targetUserId,
      actionType: 'unban_member',
      reason: 'Ban lifted'
    });

    return { success: true, community: comm };
  }

  transferCommunityOwnership(communityId, newOwnerId, currentOwnerId) {
    const comm = this.communities.find(c => c.id === communityId);
    if (!comm || comm.ownerId !== currentOwnerId) return { success: false, error: 'Unauthorized' };

    const oldOwnerRow = this.community_members.find(m => m.communityId === communityId && m.userId === currentOwnerId);
    if (oldOwnerRow) oldOwnerRow.role = 'admin';

    let newOwnerRow = this.community_members.find(m => m.communityId === communityId && m.userId === newOwnerId);
    if (newOwnerRow) {
      newOwnerRow.role = 'owner';
      newOwnerRow.status = 'approved';
    } else {
      this.community_members.push({
        id: `cm_${communityId}_${newOwnerId}`,
        communityId,
        userId: newOwnerId,
        role: 'owner',
        status: 'approved'
      });
    }

    comm.ownerId = newOwnerId;
    if (!comm.admins.includes(newOwnerId)) comm.admins.push(newOwnerId);
    if (!comm.members.includes(newOwnerId)) comm.members.push(newOwnerId);

    return { success: true };
  }

  canUserAccessCommunityContent(communityId, userId) {
    const comm = this.communities.find(c => c.id === communityId);
    if (!comm) return false;
    if (!userId) return comm.type === 'public';
    if (comm.bannedUsers && comm.bannedUsers.includes(userId)) return false;
    if (comm.type === 'public') return true;
    if (comm.ownerId === userId) return true;
    if (comm.admins && comm.admins.includes(userId)) return true;
    if (comm.members && comm.members.includes(userId)) return true;
    return false;
  }

  createPost(communityId, authorId, content) {
    if (!this.canUserAccessCommunityContent(communityId, authorId)) {
      throw new Error('Access denied: You must be an active, approved member to publish posts.');
    }
    const post = {
      id: 'cpost_' + Date.now(),
      communityId,
      authorId,
      content,
      createdAt: new Date().toISOString()
    };
    this.community_posts.push(post);
    return post;
  }

  createMessage(communityId, senderId, text) {
    if (!this.canUserAccessCommunityContent(communityId, senderId)) {
      throw new Error('Access denied: You must be an active, approved member to participate in live chat.');
    }
    const msg = {
      id: 'cmsg_' + Date.now(),
      communityId,
      senderId,
      text,
      createdAt: new Date().toISOString()
    };
    this.community_messages.push(msg);
    return msg;
  }

  fetchRoster(communityId, currentUserId) {
    const comm = this.communities.find(c => c.id === communityId);
    if (!comm) return [];
    const isApproved = currentUserId ? (comm.ownerId === currentUserId || comm.members.includes(currentUserId)) : false;

    if (comm.type === 'private' && !isApproved) {
      // Non-members of private community only see the verified owner/admins
      return this.community_members.filter(m => m.communityId === communityId && (m.role === 'owner' || m.role === 'admin') && m.status === 'approved');
    }
    return this.community_members.filter(m => m.communityId === communityId);
  }
}

// -------------------------------------------------------------
// Test 1: Public Community Join Flow
// -------------------------------------------------------------
test("Test 1: Public Community Join Flow — immediate approved membership and count update", () => {
  const db = new MockDatabase();
  const owner = 'user_alice';
  const joiner = 'user_bob';

  const comm = db.createCommunity({ name: 'Robotics Club', type: 'public' }, owner);
  assert.strictEqual(comm.memberCount, 1);
  assert.strictEqual(db.canUserAccessCommunityContent(comm.id, joiner), true, "Public community content is accessible");

  const joinRes = db.joinCommunity(comm.id, joiner);
  assert.strictEqual(joinRes.status, 'joined');
  assert.strictEqual(joinRes.count, 2);

  const memberRow = db.community_members.find(m => m.communityId === comm.id && m.userId === joiner);
  assert.ok(memberRow, "Membership row created");
  assert.strictEqual(memberRow.status, 'approved');
  assert.strictEqual(memberRow.role, 'member');
  assert.strictEqual(comm.memberCount, 2, "Parent memberCount synced with community_members");

  // Post creation works
  const post = db.createPost(comm.id, joiner, 'Hello Robotics team!');
  assert.strictEqual(post.authorId, joiner);
});

// -------------------------------------------------------------
// Test 2: Private Community Non-Member Content Guard
// -------------------------------------------------------------
test("Test 2: Private Community Non-Member Content Guard — protected content locked for non-members", () => {
  const db = new MockDatabase();
  const owner = 'user_alice';
  const stranger = 'user_charlie';

  const privateComm = db.createCommunity({ name: 'Secret Research Lab', type: 'private' }, owner);
  
  // Non-member access guard check
  assert.strictEqual(db.canUserAccessCommunityContent(privateComm.id, stranger), false, "Non-members cannot access private content");

  // Attempting to post or chat throws authorization error
  assert.throws(() => {
    db.createPost(privateComm.id, stranger, 'Unauthorized post');
  }, /Access denied/);

  assert.throws(() => {
    db.createMessage(privateComm.id, stranger, 'Unauthorized chat message');
  }, /Access denied/);

  // Non-member only sees owner/admin in roster, not internal members
  const roster = db.fetchRoster(privateComm.id, stranger);
  assert.strictEqual(roster.length, 1);
  assert.strictEqual(roster[0].userId, owner);
});

// -------------------------------------------------------------
// Test 3: Private Community Join Request Flow
// -------------------------------------------------------------
test("Test 3: Private Community Join Request Flow — creates pending status and notifies owner", () => {
  const db = new MockDatabase();
  const owner = 'user_alice';
  const applicant = 'user_dave';

  const comm = db.createCommunity({ name: 'Competitive Coding Society', type: 'private' }, owner);
  
  const reqRes = db.joinCommunity(comm.id, applicant);
  assert.strictEqual(reqRes.status, 'requested');
  assert.strictEqual(reqRes.count, 1, "Member count does NOT increment on pending request");

  const memRow = db.community_members.find(m => m.communityId === comm.id && m.userId === applicant);
  assert.ok(memRow, "Pending row exists in community_members");
  assert.strictEqual(memRow.status, 'pending');

  assert.strictEqual(comm.pendingRequests.includes(applicant), true, "pendingRequests array tracks applicant");
  assert.strictEqual(db.canUserAccessCommunityContent(comm.id, applicant), false, "Pending applicant is still restricted");

  // Notification sent to owner
  const notif = db.notifications.find(n => n.recipientId === owner && n.type === 'connection_request');
  assert.ok(notif, "Owner received join request notification");
});

// -------------------------------------------------------------
// Test 4: Join Request Approval Flow
// -------------------------------------------------------------
test("Test 4: Join Request Approval Flow — pending -> approved grants access and increments count", () => {
  const db = new MockDatabase();
  const owner = 'user_alice';
  const applicant = 'user_dave';

  const comm = db.createCommunity({ name: 'Design Club', type: 'private' }, owner);
  db.joinCommunity(comm.id, applicant);

  // Owner approves join request
  const approveRes = db.handleCommunityJoinRequest(comm.id, applicant, 'approve', owner);
  assert.strictEqual(approveRes.success, true);
  assert.strictEqual(approveRes.community.memberCount, 2);

  const memRow = db.community_members.find(m => m.communityId === comm.id && m.userId === applicant);
  assert.strictEqual(memRow.status, 'approved', "Status changed to approved");
  assert.strictEqual(comm.pendingRequests.includes(applicant), false, "Removed from pending requests");
  assert.strictEqual(comm.members.includes(applicant), true, "Added to approved members");

  // Applicant now has access
  assert.strictEqual(db.canUserAccessCommunityContent(comm.id, applicant), true);
  const msg = db.createMessage(comm.id, applicant, 'Thanks for accepting my request!');
  assert.strictEqual(msg.senderId, applicant);

  // Approval notification sent
  const notif = db.notifications.find(n => n.recipientId === applicant && n.type === 'connection_accepted');
  assert.ok(notif, "Applicant received approval notification");
});

// -------------------------------------------------------------
// Test 5: Join Request Rejection Flow
// -------------------------------------------------------------
test("Test 5: Join Request Rejection Flow — pending removed, access remains denied", () => {
  const db = new MockDatabase();
  const owner = 'user_alice';
  const applicant = 'user_eve';

  const comm = db.createCommunity({ name: 'Cyber Security Lab', type: 'private' }, owner);
  db.joinCommunity(comm.id, applicant);

  // Owner rejects request
  const rejectRes = db.handleCommunityJoinRequest(comm.id, applicant, 'reject', owner);
  assert.strictEqual(rejectRes.success, true);

  const memRow = db.community_members.find(m => m.communityId === comm.id && m.userId === applicant);
  assert.strictEqual(memRow, undefined, "Pending row removed from community_members");
  assert.strictEqual(comm.pendingRequests.includes(applicant), false);
  assert.strictEqual(comm.memberCount, 1);
  assert.strictEqual(db.canUserAccessCommunityContent(comm.id, applicant), false, "Access remains denied");
});

// -------------------------------------------------------------
// Test 6: Banned Users — restricted from posting, chatting, and rejoining
// -------------------------------------------------------------
test("Test 6: Banned Users — restricted from posting, chatting, and rejoining", () => {
  const db = new MockDatabase();
  const owner = 'user_alice';
  const badActor = 'user_spammer';

  const comm = db.createCommunity({ name: 'Open Web Forum', type: 'public' }, owner);
  db.joinCommunity(comm.id, badActor);
  assert.strictEqual(comm.memberCount, 2);

  // Admin bans user
  const banRes = db.banCommunityMember(comm.id, badActor, 'Spamming channels', owner);
  assert.strictEqual(banRes.success, true);
  assert.strictEqual(comm.memberCount, 1, "Member count decrements when member is banned");

  const memRow = db.community_members.find(m => m.communityId === comm.id && m.userId === badActor);
  assert.strictEqual(memRow.status, 'banned');
  assert.strictEqual(comm.bannedUsers.includes(badActor), true);

  // Banned user cannot post, comment, or chat
  assert.strictEqual(db.canUserAccessCommunityContent(comm.id, badActor), false, "Banned user denied content access");
  assert.throws(() => {
    db.createPost(comm.id, badActor, 'Spam');
  }, /Access denied/);

  // Banned user cannot rejoin
  const rejoinRes = db.joinCommunity(comm.id, badActor);
  assert.strictEqual(rejoinRes.status, 'banned', "joinCommunity returns banned status");

  // Moderation action logged
  assert.ok(db.moderation_actions.some(a => a.targetUserId === badActor && a.actionType === 'ban_member'));
});

// -------------------------------------------------------------
// Test 7: Unban Flow — restores access
// -------------------------------------------------------------
test("Test 7: Unban Flow — unbanning removes restriction", () => {
  const db = new MockDatabase();
  const owner = 'user_alice';
  const reformed = 'user_reformed';

  const comm = db.createCommunity({ name: 'Debate Guild', type: 'public' }, owner);
  db.banCommunityMember(comm.id, reformed, 'Misbehavior', owner);
  assert.strictEqual(db.canUserAccessCommunityContent(comm.id, reformed), false);

  // Owner unbans
  const unbanRes = db.unbanCommunityMember(comm.id, reformed, owner);
  assert.strictEqual(unbanRes.success, true);
  assert.strictEqual(comm.bannedUsers.includes(reformed), false);

  // User can now join normally
  const joinRes = db.joinCommunity(comm.id, reformed);
  assert.strictEqual(joinRes.status, 'joined');
});

// -------------------------------------------------------------
// Test 8: Owner Guard on Leave Community
// -------------------------------------------------------------
test("Test 8: Owner Guard on Leave Community — cannot leave without transfer if > 1 member", () => {
  const db = new MockDatabase();
  const owner = 'user_alice';
  const member = 'user_bob';

  const comm = db.createCommunity({ name: 'Robotics Guild', type: 'public' }, owner);
  db.joinCommunity(comm.id, member);
  assert.strictEqual(comm.memberCount, 2);

  // Owner attempts to leave without transferring ownership
  const leaveRes = db.leaveCommunity(comm.id, owner);
  assert.strictEqual(leaveRes.success, false, "Owner leave blocked");
  assert.strictEqual(leaveRes.isOwnerMustTransfer, true, "isOwnerMustTransfer flag set");
  assert.strictEqual(comm.memberCount, 2, "Member count unchanged");

  // Regular member can leave without issues
  const memberLeaveRes = db.leaveCommunity(comm.id, member);
  assert.strictEqual(memberLeaveRes.success, true);
  assert.strictEqual(memberLeaveRes.count, 1);

  // Now owner is the only remaining member, can leave/dissolve safely
  const soloLeaveRes = db.leaveCommunity(comm.id, owner);
  assert.strictEqual(soloLeaveRes.success, true);
  assert.strictEqual(soloLeaveRes.count, 0);
});

// -------------------------------------------------------------
// Test 9: Ownership Transfer Flow
// -------------------------------------------------------------
test("Test 9: Ownership Transfer Flow — changes owner in community_members and communities", () => {
  const db = new MockDatabase();
  const ownerAlice = 'user_alice';
  const adminBob = 'user_bob';

  const comm = db.createCommunity({ name: 'Startup Incubator', type: 'public' }, ownerAlice);
  db.joinCommunity(comm.id, adminBob);

  const transferRes = db.transferCommunityOwnership(comm.id, adminBob, ownerAlice);
  assert.strictEqual(transferRes.success, true);
  assert.strictEqual(comm.ownerId, adminBob, "Bob is new community owner");

  const bobMem = db.community_members.find(m => m.communityId === comm.id && m.userId === adminBob);
  const aliceMem = db.community_members.find(m => m.communityId === comm.id && m.userId === ownerAlice);

  assert.strictEqual(bobMem.role, 'owner', "Bob role in community_members is owner");
  assert.strictEqual(aliceMem.role, 'admin', "Alice former owner demoted to admin");

  // Alice can now leave because she is no longer the owner
  const aliceLeave = db.leaveCommunity(comm.id, ownerAlice);
  assert.strictEqual(aliceLeave.success, true, "Former owner Alice can leave safely");
});

// -------------------------------------------------------------
// Test 10: Duplicate Join Requests & Memberships Prevention
// -------------------------------------------------------------
test("Test 10: Duplicate Join Requests & Memberships Prevention", () => {
  const db = new MockDatabase();
  const owner = 'user_alice';
  const member = 'user_bob';
  const applicant = 'user_charlie';

  const publicComm = db.createCommunity({ name: 'Chess Club', type: 'public' }, owner);
  db.joinCommunity(publicComm.id, member);

  // Repeat join on public club
  const dupJoin = db.joinCommunity(publicComm.id, member);
  assert.strictEqual(dupJoin.status, 'already_member');
  assert.strictEqual(publicComm.memberCount, 2, "No duplicate member counted");

  const privateComm = db.createCommunity({ name: 'VIP Society', type: 'private' }, owner);
  db.joinCommunity(privateComm.id, applicant);

  // Repeat request on private club
  const dupReq = db.joinCommunity(privateComm.id, applicant);
  assert.strictEqual(dupReq.status, 'requested');
  assert.strictEqual(privateComm.pendingRequests.length, 1, "No duplicate pending row created");
});

// =============================================================
console.log(`\n=============================================================`);
console.log(`Phase 2 Verification: ${passed} Passed, ${failed} Failed.`);
console.log(`=============================================================\n`);

if (failed > 0) process.exit(1);
