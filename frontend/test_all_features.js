import { io } from 'socket.io-client';

const socket1 = io('http://localhost:8080', { transports: ['websocket'] });
const socket2 = io('http://localhost:8080', { transports: ['websocket'] });

console.log('🔄 Starting Full Feature Integration Test...');

let typingReceived = false;
let messageReceived = false;
let reactionReceived = false;

socket1.on('connect', () => {
  console.log('  - Socket 1 registered (User 8)');
  socket1.emit('register', { user_id: 8 });
});

socket2.on('connect', () => {
  console.log('  - Socket 2 registered (User 9)');
  socket2.emit('register', { user_id: 9 });
});

// Listener: Typing indicator
socket2.on('user-typing', (data) => {
  console.log('  ✅ Socket 2 received typing state:', data);
  if (data.sender_id === 8 && data.is_typing === true) {
    typingReceived = true;
  }
});

// Listener: Message receipt
socket2.on('receive-message', (data) => {
  console.log('  ✅ Socket 2 received message:', data.text);
  messageReceived = true;
  
  // Try sending reaction from user 9
  console.log('  - User 9 sending reaction to message ID:', data.id);
  socket2.emit('add-reaction', {
    messageId: data.id,
    reaction: { userId: 9, emoji: '❤️' }
  });
});

// Listener: Reaction receipt
socket1.on('reaction-added', (data) => {
  console.log('  ✅ Socket 1 received reaction details:', data);
  if (data.reactions && data.reactions.some(r => r.emoji === '❤️')) {
    reactionReceived = true;
    console.log('🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
    socket1.disconnect();
    socket2.disconnect();
    process.exit(0);
  }
});

// Run sequence
setTimeout(() => {
  console.log('  - User 8 starts typing...');
  socket1.emit('typing', { sender_id: 8, receiver_id: 9, is_typing: true });
}, 1000);

setTimeout(() => {
  console.log('  - User 8 sends message...');
  socket1.emit('message', { sender_id: 8, receiver_id: 9, text: 'Audit verification message!' });
}, 2000);

setTimeout(() => {
  console.log('❌ Timeout occurred. Features missing or failed.');
  socket1.disconnect();
  socket2.disconnect();
  process.exit(1);
}, 6000);
