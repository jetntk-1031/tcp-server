const net = require('net');

// Use the port provided by the environment, or a default of 3000.
// Railway will set the PORT environment variable.
const PORT = 50010;
const HOST = '0.0.0.0';

// Create the TCP server
const server = net.createServer((socket) => {
  // 'connection' listener.
  console.log(`[SERVER] Client connected from ${socket.remoteAddress}:${socket.remotePort}`);

  // Event handler for when the client sends data
  socket.on('data', (data) => {
    const message = data.toString().trim();
    console.log(`[SERVER] Received from client: '${message}'`);
    
    // Echo the data back to the client
    console.log(`[SERVER] Echoing message back: '${message}'`);
    socket.write(data);
  });

  // Event handler for when the client disconnects
  socket.on('end', () => {
    console.log(`[SERVER] Client disconnected from ${socket.remoteAddress}:${socket.remotePort}`);
  });

  // Event handler for socket errors
  socket.on('error', (err) => {
    console.error(`[SERVER] Socket error: ${err.message}`);
  });
});

// Start the server and listen on the specified port and host
server.listen(PORT, HOST, () => {
  console.log(`[SERVER] Listening for TCP connections on ${HOST}:${PORT}`);
});
