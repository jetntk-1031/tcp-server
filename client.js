const net = require('net'); // Node.js's built-in networking module
const client = new net.Socket(); // Create a new TCP client socket.

const HOST = 'interchange.proxy.rlwy.net';
const PORT = 55512;

// Connect to the TCP server using the provided host and port.
client.connect(PORT, HOST, () => {
    console.log(`Connected to the TCP server at ${HOST}:${PORT}`);
    
    // Send a message to the server after a successful connection.
    client.write('Hello from the client!');
});

// Event listener for when the client receives data from the server.
client.on('data', (data) => {
    console.log(`Received data from server: ${data.toString().trim()}`);
    
    // Close the connection after receiving a response.
    client.destroy(); 
});

// Event listener for when the connection is closed.
client.on('close', () => {
    console.log('Connection to the server has been closed.');
});

// Event listener for any errors that occur.
client.on('error', (err) => {
    console.error(`Client error: ${err.message}`);
});