import { io } from 'socket.io-client';

// Create socket instance with optimized settings
export const socket = io(process.env.NODE_ENV === 'development' ? `http://localhost:3000` : `https://snake-n-ladder-nine.vercel.app`, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 3,
  reconnectionDelay: 1000,
  timeout: 5000,
  transports: ['websocket'],
  forceNew: true
});

// Export initialize function for components that need to ensure socket is ready
export const initializeSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
};

// Get the socket instance (initializing if needed)
export const getSocket = () => {
  if (!socket.connected) {
    initializeSocket();
  }
  return socket;
};

// Disconnect the socket
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};