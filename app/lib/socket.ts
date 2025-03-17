import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeSocket = (): Socket => {
  if (!socket) {
    // First, initialize Socket.io connection by pinging the API endpoint
    fetch('/api/socket').catch(err => console.error('Could not connect to socket server', err));
    
    // Then create the socket connection
    socket = io({
      path: '/api/socket',
      addTrailingSlash: false,
    });

    // Log connection status
    socket.on('connect', () => {
      console.log('Connected to server with ID:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
  }

  return socket;
};

// Get the socket instance (initializing if needed)
export const getSocket = (): Socket => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

// Disconnect the socket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};