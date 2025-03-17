import { NextResponse } from 'next/server';
import { Server as SocketServer } from 'socket.io';
import type { NextApiRequest } from 'next';
import type { NextApiResponse } from 'next';
import type { Server as HTTPServer } from 'http';

declare global {
  // eslint-disable-next-line no-var
  var __nextSocketHandler__: (req: NextApiRequest, res: NextApiResponse & { 
    socket: { 
      server: HTTPServer & { 
        io?: SocketServer 
      } 
    } 
  }) => void;
}

// Export HTTP methods required by Next.js App Router
export async function GET() {
  return NextResponse.json({ message: 'Socket.io server is running' });
}

// This sets up Socket.io when the server starts
if (typeof window === 'undefined') {
  // Server-side only code
  const ioHandler = (req: NextApiRequest, res: NextApiResponse & { 
    socket: { 
      server: HTTPServer & { 
        io?: SocketServer 
      } 
    } 
  }) => {
    if (!res.socket.server.io) {
      const io = new SocketServer(res.socket.server, {
        path: '/api/socket',
        addTrailingSlash: false,
      });
      
      res.socket.server.io = io;

      // Socket.io connection handler
      io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);
        
        // Player joins lobby
        socket.on('joinLobby', (data) => {
          console.log(`${data.name} joined the lobby`);
          // Broadcast to all clients
          io.emit('lobbyUpdate', { 
            playerId: socket.id, 
            name: data.name,
            joined: true 
          });
        });
        
        // Player scans QR code
        socket.on('qrScanned', (data) => {
          console.log(`QR scanned by ${socket.id}:`, data);
          // Process answer and emit results
          const isCorrect = Math.random() > 0.5; // Placeholder logic
          io.emit('taskResult', {
            playerId: socket.id,
            taskId: data.taskId,
            isCorrect,
            moveAmount: isCorrect ? 5 : -3
          });
        });
        
        // Handle disconnect
        socket.on('disconnect', () => {
          console.log('Client disconnected:', socket.id);
          io.emit('playerLeft', { playerId: socket.id });
        });
      });
    }
    
    res.end();
  };
  
  // Attach ioHandler to global object to be used by server.js
  global.__nextSocketHandler__ = ioHandler;
}

export const runtime = 'nodejs';