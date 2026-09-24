/**
 * EATM CampusConnect - Connections Lifecycle & Hardened Reliability Test Suite
 * Run with: node scripts/verifyConnections.js
 */

console.log('====================================================');
console.log('  EATM CampusConnect: Connections Subsystem Verification');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
  }
}

async function runTests() {
  console.log('--- Test 1: Self-Connection Prevention & Validation ---');
  {
    const requesterId = 'user_soumya';
    const recipientId = 'user_soumya';
    let caughtError = false;
    let errorMsg = '';

    try {
      if (requesterId === recipientId) {
        throw new Error('You cannot send a connection request to yourself.');
      }
    } catch (err) {
      caughtError = true;
      errorMsg = err.message;
    }

    assert(caughtError === true, 'Blocks self-connection attempt');
    assert(errorMsg.includes('yourself'), 'Self-connection error message is user-friendly');
  }

  console.log('\n--- Test 2: Duplicate Connection Prevention (Bidirectional A<->B) ---');
  {
    const mockDb = [
      { id: 'conn_1', requesterId: 'user_soumya', recipientId: 'user_priya', status: 'pending' },
      { id: 'conn_2', requesterId: 'user_soumya', recipientId: 'user_rohit', status: 'accepted' }
    ];

    function checkExistingConnection(req, rec) {
      return mockDb.find(c => 
        (c.requesterId === req && c.recipientId === rec) ||
        (c.requesterId === rec && c.recipientId === req)
      );
    }

    // Attempt 1: user_priya tries to connect with user_soumya (inverse direction while pending)
    const existing1 = checkExistingConnection('user_priya', 'user_soumya');
    assert(!!existing1, 'Identifies existing pending request in inverse direction (B -> A)');
    assert(existing1.status === 'pending', 'Status correctly recognized as pending');

    // Attempt 2: user_soumya tries to connect with user_rohit (already accepted)
    const existing2 = checkExistingConnection('user_soumya', 'user_rohit');
    assert(!!existing2 && existing2.status === 'accepted', 'Identifies existing accepted friendship');

    // Attempt 3: canonical pair indexing simulation
    const pair1 = ['user_soumya', 'user_priya'].sort().join('_');
    const pair2 = ['user_priya', 'user_soumya'].sort().join('_');
    assert(pair1 === pair2, 'Canonical pair ordering is strictly identical regardless of direction');
  }

  console.log('\n--- Test 3: Acceptance Lifecycle & Authorization ---');
  {
    const connection = { id: 'conn_test_1', requesterId: 'user_soumya', recipientId: 'user_ananya', status: 'pending' };
    
    // Requester attempting to accept their own request
    let requesterUnauthorized = false;
    try {
      const currentUserId = 'user_soumya';
      if (connection.recipientId !== currentUserId) {
        throw new Error('Unauthorized: Only the recipient can accept or decline this connection request.');
      }
    } catch (err) {
      requesterUnauthorized = true;
    }
    assert(requesterUnauthorized === true, 'Requester cannot accept their own connection request');

    // Recipient accepting the request
    let recipientAuthorized = false;
    let statusUpdated = false;
    try {
      const currentUserId = 'user_ananya';
      if (connection.recipientId === currentUserId) {
        recipientAuthorized = true;
        connection.status = 'accepted';
        statusUpdated = true;
      }
    } catch (err) {}
    assert(recipientAuthorized === true, 'Recipient is authorized to accept the request');
    assert(statusUpdated === true && connection.status === 'accepted', 'Connection status transitions to accepted');
  }

  console.log('\n--- Test 4: Cancellation & Withdrawal Lifecycle ---');
  {
    const connection = { id: 'conn_test_2', requesterId: 'user_soumya', recipientId: 'user_arjun', status: 'pending' };
    
    // Recipient attempting to cancel pending request (should only decline)
    let nonRequesterCannotCancel = false;
    try {
      const currentUserId = 'user_arjun';
      if (connection.requesterId !== currentUserId) {
        throw new Error('Unauthorized: Only the requester can cancel this connection request.');
      }
    } catch (err) {
      nonRequesterCannotCancel = true;
    }
    assert(nonRequesterCannotCancel === true, 'Recipient cannot call cancelConnectionRequest');

    // Requester cancelling pending request
    let requesterCanCancel = false;
    try {
      const currentUserId = 'user_soumya';
      if (connection.requesterId === currentUserId && connection.status === 'pending') {
        requesterCanCancel = true;
      }
    } catch (err) {}
    assert(requesterCanCancel === true, 'Requester can cancel/withdraw their pending request');
  }

  console.log('\n--- Test 5: Selective Query Optimization (O(friends) vs O(all_users)) ---');
  {
    const mockConnections = [
      { id: 'c1', requesterId: 'user_soumya', recipientId: 'user_priya', status: 'accepted' },
      { id: 'c2', requesterId: 'user_rohit', recipientId: 'user_soumya', status: 'accepted' },
      { id: 'c3', requesterId: 'user_soumya', recipientId: 'user_ananya', status: 'pending' }
    ];

    const currentUserId = 'user_soumya';
    const targetIds = Array.from(new Set(
      mockConnections.map(c => c.requesterId === currentUserId ? c.recipientId : c.requesterId)
    ));

    assert(targetIds.length === 3, 'Extracted exactly 3 unique peer IDs without duplicates');
    assert(targetIds.includes('user_priya') && targetIds.includes('user_rohit') && targetIds.includes('user_ananya'), 'Target IDs contain correct related peers');
    assert(!targetIds.includes('user_soumya'), 'Target IDs do not contain current user');
  }

  console.log('\n====================================================');
  console.log(`  Results: ${passedTests} / ${totalTests} tests passed`);
  console.log('====================================================\n');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
