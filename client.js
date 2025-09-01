const http = require('http');

// Use the port provided by the environment, or a default of 3000.
// Railway will set the PORT environment variable.
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Create the HTTP server
const server = http.createServer((req, res) => {
  console.log(`[SERVER] Request received from ${req.socket.remoteAddress}:${req.socket.remotePort}`);

  // Set the response HTTP header with a status and content type
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  
  // Write the response body
  res.end('Hello, World!');
});

// Start the server and listen on the specified port and host
server.listen(PORT, HOST, () => {
  console.log(`[SERVER] Listening for HTTP requests on ${HOST}:${PORT}`);
});
