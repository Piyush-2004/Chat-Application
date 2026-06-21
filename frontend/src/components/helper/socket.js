import { io } from 'socket.io-client';

const socketUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const socket = io(socketUrl, {
  transports: ['websocket'],
  autoConnect: false
});

socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
  const userData = localStorage.getItem('user');
  if (userData) {
    try {
      const user = JSON.parse(userData);
      if (user && user.id) {
        socket.emit('register', { user_id: user.id });
        console.log('Automatically registered user on connect:', user.id);
      }
    } catch (err) {
      console.error('Error parsing user data in socket connect:', err);
    }
  }
});

socket.on('disconnect', () => {
  console.log('Socket disconnected');
});

export default socket;