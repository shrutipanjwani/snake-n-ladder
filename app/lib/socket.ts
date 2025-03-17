import { io } from 'socket.io-client';

// Create socket instance
export const socket = io('http://localhost:3000', {
  autoConnect: true,
  reconnection: true,
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