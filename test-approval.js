const WebSocket = require('ws');

// Test WebSocket approval flow
async function testApproval() {
  console.log('Testing approval flow...');
  
  // First create a job via API
  const jobResponse = await fetch('http://localhost:4133/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'Test approval flow',
      parameters: {}
    })
  });
  
  const { jobId } = await jobResponse.json();
  console.log('Created job:', jobId);
  
  // Connect WebSocket
  const ws = new WebSocket('ws://localhost:4133/ws');
  
  ws.on('open', () => {
    console.log('WebSocket connected');
    // Subscribe to job
    ws.send(JSON.stringify({
      type: 'subscribe',
      jobId: jobId
    }));
  });
  
  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    console.log('Received message:', message);
    
    if (message.type === 'approval_request') {
      console.log('Got approval request, sending response...');
      
      // Send approval response
      const response = {
        type: 'approval_response',
        jobId: jobId,
        data: {
          approvalId: message.data.approvalId,
          decision: 'approve',
          comment: 'Test approval'
        }
      };
      
      console.log('Sending approval response:', response);
      ws.send(JSON.stringify(response));
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
}

// Run test
testApproval().catch(console.error);