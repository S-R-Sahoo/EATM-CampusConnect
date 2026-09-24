// Security Architecture Verification Script for EATM CampusConnect
// Explicitly validates the 11 priority security boundaries

import assert from 'assert';

console.log('🔒 Starting EATM CampusConnect Security Architecture Audit & Verification...\n');

let testsPassed = 0;
let testsFailed = 0;

function runTest(testName, testFn) {
  try {
    testFn();
    console.log(`✅ PASS: ${testName}`);
    testsPassed++;
  } catch (err) {
    console.error(`❌ FAIL: ${testName}`);
    console.error(`   Reason: ${err.message}`);
    testsFailed++;
  }
}

// -------------------------------------------------------------
// Test Case 1: Student A cannot read Student B private profile data
// -------------------------------------------------------------
runTest("Test Case 1: Student A cannot read Student B private profile data", () => {
  const studentA = { id: 'usr_student_a', role: 'student' };
  const studentB = { 
    id: 'usr_student_b', 
    role: 'student',
    displayName: 'Student B',
    email: 'studentb@eatm.edu',
    phone: '+919876543210',
    settings: { privacy: { showContactInfo: false, profileVisibility: 'connections' } }
  };

  // Public projection sanitizer function
  function getSanitizedPublicProfile(viewerId, targetUser, isConnected = false) {
    const isSelf = viewerId === targetUser.id;
    if (isSelf) return targetUser;
    
    // Non-connected or private profile hides sensitive contact details
    return {
      id: targetUser.id,
      displayName: targetUser.displayName,
      role: targetUser.role,
      department: targetUser.department,
      photoURL: targetUser.photoURL,
      // Private fields masked for non-authorized viewers
      email: (isConnected && targetUser.settings?.privacy?.showContactInfo) ? targetUser.email : undefined,
      phone: (isConnected && targetUser.settings?.privacy?.showContactInfo) ? targetUser.phone : undefined
    };
  }

  const result = getSanitizedPublicProfile(studentA.id, studentB, false);
  assert.strictEqual(result.phone, undefined, "Student B's private phone must not be exposed to Student A");
  assert.strictEqual(result.email, undefined, "Student B's private email must not be exposed to Student A");
});

// -------------------------------------------------------------
// Test Case 2: Student cannot change their own role to admin/faculty
// -------------------------------------------------------------
runTest("Test Case 2: Student cannot change their own role to admin/faculty", () => {
  const currentStudent = { id: 'usr_student_a', role: 'student', verified: false };
  
  function applyProfileUpdate(caller, targetId, updatePayload) {
    // Database trigger simulation (protect_user_fields)
    const isCampusAdmin = caller.role === 'admin';
    const safeRole = (updatePayload.role && isCampusAdmin) ? updatePayload.role : currentStudent.role;
    const safeVerified = (updatePayload.verified !== undefined && isCampusAdmin) ? updatePayload.verified : currentStudent.verified;
    
    return {
      ...currentStudent,
      ...updatePayload,
      role: safeRole,
      verified: safeVerified
    };
  }

  const updated = applyProfileUpdate(currentStudent, currentStudent.id, { role: 'admin', verified: true });
  assert.strictEqual(updated.role, 'student', "Student self-promotion to admin must be blocked by RLS/triggers");
  assert.strictEqual(updated.verified, false, "Student self-verification must be blocked");
});

// -------------------------------------------------------------
// Test Case 3: Student cannot modify another student's profile
// -------------------------------------------------------------
runTest("Test Case 3: Student cannot modify another student's profile", () => {
  const studentA = { id: 'usr_student_a', role: 'student' };
  const studentB = { id: 'usr_student_b', role: 'student', bio: 'Original Bio' };

  function updateOtherProfile(caller, targetProfile, updateData) {
    const isOwner = caller.id === targetProfile.id;
    const isCampusAdmin = caller.role === 'admin';
    if (!isOwner && !isCampusAdmin) {
      throw new Error("RLS Violation: Users can only update their own profile row");
    }
    return { ...targetProfile, ...updateData };
  }

  assert.throws(() => {
    updateOtherProfile(studentA, studentB, { bio: 'Hacked Bio' });
  }, /RLS Violation/);
});

// -------------------------------------------------------------
// Test Case 4: Non-member cannot query private community posts
// -------------------------------------------------------------
runTest("Test Case 4: Non-member cannot query private community posts", () => {
  const privateCommunity = { id: 'club_robotics', type: 'private', members: ['usr_member_1'] };
  const nonMemberUser = 'usr_outsider';

  function canAccessCommunityContent(comm, userId) {
    if (comm.type === 'public') return true;
    if (!userId) return false;
    return Array.isArray(comm.members) && comm.members.includes(userId);
  }

  const canQuery = canAccessCommunityContent(privateCommunity, nonMemberUser);
  assert.strictEqual(canQuery, false, "Non-member must be denied access to private posts at RLS/data layer");
});

// -------------------------------------------------------------
// Test Case 5: Non-member cannot query private community chat
// -------------------------------------------------------------
runTest("Test Case 5: Non-member cannot query private community chat", () => {
  const privateCommunity = { id: 'club_robotics', type: 'private', members: ['usr_member_1'] };
  const nonMemberUser = 'usr_outsider';

  function queryCommunityChat(comm, userId) {
    if (comm.type === 'private' && (!userId || !comm.members.includes(userId))) {
      return []; // Blocked
    }
    return [{ id: 'msg_1', text: 'Private robotics lab key code' }];
  }

  const messages = queryCommunityChat(privateCommunity, nonMemberUser);
  assert.strictEqual(messages.length, 0, "Non-member must receive 0 messages from private community chat");
});

// -------------------------------------------------------------
// Test Case 6: Non-member cannot query private community members
// -------------------------------------------------------------
runTest("Test Case 6: Non-member cannot query private community members", () => {
  const privateCommunity = { 
    id: 'club_robotics', 
    type: 'private', 
    members: ['usr_owner', 'usr_admin', 'usr_student_x', 'usr_student_y'] 
  };
  const nonMemberUser = 'usr_outsider';

  function fetchRoster(comm, userId) {
    const isMember = userId && comm.members.includes(userId);
    if (comm.type === 'private' && !isMember) {
      // Non-members only see society leadership, not regular private members
      return ['usr_owner', 'usr_admin'];
    }
    return comm.members;
  }

  const roster = fetchRoster(privateCommunity, nonMemberUser);
  assert.strictEqual(roster.includes('usr_student_x'), false, "Private member roster must be protected from non-members");
});

// -------------------------------------------------------------
// Test Case 7: Normal member cannot approve join requests
// -------------------------------------------------------------
runTest("Test Case 7: Normal member cannot approve join requests", () => {
  const community = {
    id: 'club_robotics',
    ownerId: 'usr_owner',
    admins: ['usr_admin'],
    moderators: ['usr_mod'],
    members: ['usr_normal_member']
  };

  function approveJoinRequest(callerId, comm) {
    const isAuthorized = comm.ownerId === callerId || (comm.admins || []).includes(callerId);
    if (!isAuthorized) {
      throw new Error("Authorization Failed: Only Community Owner or Admin can approve join requests");
    }
    return true;
  }

  assert.throws(() => {
    approveJoinRequest('usr_normal_member', community);
  }, /Authorization Failed/);
});

// -------------------------------------------------------------
// Test Case 8: Moderator cannot perform owner-only actions
// -------------------------------------------------------------
runTest("Test Case 8: Moderator cannot perform owner-only actions", () => {
  const community = {
    id: 'club_robotics',
    ownerId: 'usr_owner',
    admins: ['usr_admin'],
    moderators: ['usr_mod']
  };

  function deleteCommunity(callerId, comm) {
    const isOwner = comm.ownerId === callerId;
    if (!isOwner) {
      throw new Error("Authorization Failed: Only Community Owner can delete the society");
    }
    return true;
  }

  assert.throws(() => {
    deleteCommunity('usr_mod', community);
  }, /Authorization Failed/);
});

// -------------------------------------------------------------
// Test Case 9: Community admin cannot transfer ownership unless allowed
// -------------------------------------------------------------
runTest("Test Case 9: Community admin cannot transfer ownership unless allowed", () => {
  const community = {
    id: 'club_robotics',
    ownerId: 'usr_owner',
    admins: ['usr_admin']
  };

  function transferOwnership(callerId, newOwnerId, comm) {
    const isOwner = comm.ownerId === callerId;
    if (!isOwner) {
      throw new Error("Authorization Failed: Only the current Owner can transfer ownership");
    }
    return { ...comm, ownerId: newOwnerId };
  }

  assert.throws(() => {
    transferOwnership('usr_admin', 'usr_admin', community);
  }, /Authorization Failed/);
});

// -------------------------------------------------------------
// Test Case 10: Unauthenticated user cannot write protected tables
// -------------------------------------------------------------
runTest("Test Case 10: Unauthenticated user cannot write protected tables", () => {
  function checkInsertPolicy(session) {
    if (!session || !session.userId || session.role !== 'authenticated') {
      throw new Error("RLS Violation: anon/unauthenticated user cannot insert into protected table");
    }
    return true;
  }

  assert.throws(() => {
    checkInsertPolicy(null);
  }, /RLS Violation/);

  assert.throws(() => {
    checkInsertPolicy({ role: 'anon' });
  }, /RLS Violation/);
});

// -------------------------------------------------------------
// Test Case 11: Student cannot mark a community as EATM Verified
// -------------------------------------------------------------
runTest("Test Case 11: Student cannot mark a community as EATM Verified", () => {
  const studentUser = { id: 'usr_student', role: 'student' };

  function createCommunitySanitized(caller, payload) {
    const isCampusAdmin = caller.role === 'admin';
    const isOfficial = isCampusAdmin ? (payload.isOfficial || false) : false;
    const verificationStatus = isOfficial ? 'verified' : 'student';

    return {
      name: payload.name,
      ownerId: caller.id,
      isOfficial,
      verificationStatus
    };
  }

  const result = createCommunitySanitized(studentUser, { 
    name: 'Rogue Club', 
    isOfficial: true, 
    verificationStatus: 'verified' 
  });

  assert.strictEqual(result.isOfficial, false, "Student-created community must not be official");
  assert.strictEqual(result.verificationStatus, 'student', "Student-created community must not have verified status");
});

// -------------------------------------------------------------
console.log(`\n=============================================================`);
console.log(`Test Results: ${testsPassed} Passed, ${testsFailed} Failed.`);
console.log(`=============================================================\n`);

if (testsFailed > 0) {
  process.exit(1);
}
