import { io } from 'socket.io-client';

// Get the base URL for socket connection
const getBaseUrl = () => {
  // Use the environment variable for the socket URL
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  
  // If we're in the browser and have a socket URL, use it
  if (typeof window !== 'undefined' && socketUrl) {
    return socketUrl;
  }
  
  // Fallback for development
  return 'http://localhost:3000';
};

// Create socket instance with optimized settings
export const socket = io(getBaseUrl(), {
  path: '/api/socket',
  addTrailingSlash: false,
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 3,
  reconnectionDelay: 1000,
  timeout: 5000,
  transports: ['websocket']
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