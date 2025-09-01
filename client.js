const http = require('http');

// Configuration for the server
// Use 'localhost' and the correct port for local testing
const options = {
  hostname: 'localhost',
  port: 50010,
  path: '/',
  method: 'GET'
};

// Create a new HTTP request
const req = http.request(options, (res) => {
  console.log(`[CLIENT] Connected to server.`);
  console.log(`[CLIENT] Status Code: ${res.statusCode}`);
  console.log(`[CLIENT] Headers: ${JSON.stringify(res.headers)}`);

  // Variable to store the incoming data
  let data = '';

  // A chunk of data has been received.
  res.on('data', (chunk) => {
    data += chunk;
  });

  // The whole response has been received.
  res.on('end', () => {
    console.log('[CLIENT] Response from server:');
    console.log(data);
  });
});

// Event handler for request errors
req.on('error', (e) => {
  console.error(`[CLIENT] Problem with request: ${e.message}`);
});

// End the request
req.end();
