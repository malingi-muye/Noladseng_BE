// Simple WebSocket test script
const { io } = require('socket.io-client');

console.log('Testing WebSocket connection...');

// Connect to the development server
const socket = io('http://localhost:5174', {
  transports: ['websocket', 'polling'],
  timeout: 5000,
  reconnection: true
});

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server');
  
  // Test emitting an event
  console.log('Testing product update event...');
  socket.emit('products:update');
});

socket.on('products:update', () => {
  console.log('✅ Received products:update event');
});

socket.on('services:update', () => {
  console.log('✅ Received services:update event');
});

socket.on('testimonials:update', () => {
  console.log('✅ Received testimonials:update event');
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection error:', error.message);
});

// Keep the script running for a few seconds
setTimeout(() => {
  console.log('Test completed');
  socket.disconnect();
  process.exit(0);
}, 5000);
