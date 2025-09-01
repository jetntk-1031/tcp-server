const net = require('net'); // Node.js's built-in networking module
const port = process.env.PORT || 8080; // Get port from environment variable, or use 8080 as a fallback

// Create a new TCP server instance.
// The callback function is executed when a new client connects.
const server = net.createServer((socket) => {
    // 'socket' is a unique object representing the client's connection.
    console.log(`Client connected: ${socket.remoteAddress}:${socket.remotePort}`);

    // Set the character encoding for the socket to UTF-8
    socket.setEncoding('utf-8');

    // Event listener for when the server receives data from the client.
    socket.on('data', (data) => {
        console.log(`Received data from client: ${data.toString().trim()}`);
        
        // Echo the received data back to the client.
        socket.write(`Server received your message: "${data.toString().trim()}"\n`);
    });

    // Event listener for when the client disconnects.
    socket.on('end', () => {
        console.log(`Client disconnected: ${socket.remoteAddress}:${socket.remotePort}`);
    });

    // Event listener for any errors that occur.
    socket.on('error', (err) => {
        console.error(`Socket error: ${err.message}`);
    });
});

// Start the server and listen for connections on the specified port.
server.listen(port, () => {
    console.log(`TCP server is listening on port ${port}`);
});