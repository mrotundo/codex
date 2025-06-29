// Direct test of approval flow
const { eventBus } = require('./dist/services/eventBus');
const { v4: uuidv4 } = require('uuid');

async function testApprovalFlow() {
  console.log('Testing approval flow directly...');
  
  const approvalId = uuidv4();
  console.log('Approval ID:', approvalId);
  
  // Set up approval listener
  const approvalPromise = eventBus.waitForApproval(approvalId, 5000);
  
  // Simulate approval response after 1 second
  setTimeout(() => {
    console.log('Sending approval decision...');
    eventBus.notifyApprovalDecision(approvalId, 'approve');
  }, 1000);
  
  try {
    const decision = await approvalPromise;
    console.log('Received decision:', decision);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testApprovalFlow();