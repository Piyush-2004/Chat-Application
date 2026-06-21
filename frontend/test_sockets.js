import { io } from 'socket.io-client';

const socket1 = io('http://localhost:8080', { transports: ['websocket'] });
const socket2 = io('http://localhost:8080', { transports: ['websocket'] });

console.log('Connecting test sockets...');

socket1.on('connect', () => {
  console.log('Socket 1 connected. Registering as user 8...');
  socket1.emit('register', { user_id: 8 });
});

socket2.on('connect', () => {
  console.log('Socket 2 connected. Registering as user 9...');
  socket2.emit('register', { user_id: 9 });
});

socket1.on('receive-message', (data) => {
  console.log('Socket 1 received message:', data);
});

socket2.on('receive-message', (data) => {
  console.log('Socket 2 received message:', data);
  console.log('Success! Closing connections.');
  socket1.disconnect();
  socket2.disconnect();
  process.exit(0);
});

socket1.on('error', (err) => {
  console.error('Socket 1 error:', err);
});

socket2.on('error', (err) => {
  console.error('Socket 2 error:', err);
});

// Wait 2 seconds, then send message from user 8 to user 9
setTimeout(() => {
  console.log('Sending message from user 8 to user 9...');
  socket1.emit('message', {
    sender_id: 8,
    receiver_id: 9,
    text: 'Hello from user 8!'
  });
}, 2000);

setTimeout(() => {
  console.log('Timeout. Test failed.');
  socket1.disconnect();
  socket2.disconnect();
  process.exit(1);
}, 6000);
