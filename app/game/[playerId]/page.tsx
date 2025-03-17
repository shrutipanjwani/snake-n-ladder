'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGameStore } from '@/app/store/gameStore';
import Dice from '@/app/components/Dice';
import { io, Socket } from 'socket.io-client';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params.playerId as string;
  const { currentPlayer, gameId, startGame, resetGame } = useGameStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [finalPosition, setFinalPosition] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const hasGameEndedRef = useRef(false);

  useEffect(() => {
    if (hasGameEndedRef.current) {
      console.log('Game has ended, not attempting to reconnect');
      return;
    }

    try {
      console.log('Attempting to connect to game server...');
      const socket = io('http://localhost:3000', {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 3000
      });

      socketRef.current = socket;
      setSocket(socket);
      setIsConnecting(true);

      socket.on('connect', () => {
        console.log('Connected to game server');
        setIsConnecting(false);
        setError(null);
        socket.emit('joinGame', { playerId });
      });

      socket.on('gameStart', (data) => {
        console.log('Game started:', data);
        startGame(data.gameId, data.players);
      });

      socket.on('gameEnded', (data) => {
        console.log('Game ended by admin:', data);
        hasGameEndedRef.current = true;
        const position = currentPlayer?.position || 0;
        setFinalPosition(position);
        setGameEnded(true);
        resetGame();
        socket.disconnect();
        socketRef.current = null;
        setSocket(null);
      });

      socket.on('diceRollResult', (data) => {
        console.log('Dice roll result:', data);
        if (data.newPosition !== undefined && gameId) {
          startGame(gameId, currentPlayer ? [{ ...currentPlayer, position: data.newPosition }] : []);
          if (data.hasWon) {
            hasGameEndedRef.current = true;
            setFinalPosition(data.newPosition);
            setGameEnded(true);
            resetGame();
            socket.disconnect();
            socketRef.current = null;
            setSocket(null);
          }
        }
      });

      socket.on('error', (data) => {
        console.error('Server error:', data.message);
        setError(data.message);
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from game server');
        socketRef.current = null;
        setSocket(null);
        setIsConnecting(false);
        
        if (!hasGameEndedRef.current) {
          setError('Connection lost. Attempting to reconnect...');
        }
      });

      socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        if (!hasGameEndedRef.current) {
          setError('Connection error occurred. Attempting to reconnect...');
          setIsConnecting(false);
        }
      });

      return () => {
        if (socket && !hasGameEndedRef.current) {
          socket.disconnect();
          socketRef.current = null;
          setSocket(null);
        }
      };
    } catch (err) {
      console.error('Error creating socket connection:', err);
      if (!hasGameEndedRef.current) {
        setError('Failed to connect to game server. Please refresh the page.');
        setIsConnecting(false);
      }
    }
  }, [playerId, startGame, resetGame, gameId, currentPlayer]);

  const handleDiceRoll = (value: number) => {
    if (socketRef.current?.connected) {
      console.log('Sending dice roll:', value);
      socketRef.current.emit('rollDice', {
        playerId,
        value
      });
    } else {
      console.error('Socket not connected');
      if (!hasGameEndedRef.current) {
        setError('Connection lost. Please refresh the page.');
      }
    }
  };

  const handleCloseTab = () => {
    window.close();
    setTimeout(() => {
      alert('Please close this tab manually');
    }, 100);
  };

  if (gameEnded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-100 to-indigo-100">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <h1 className="text-3xl font-bold text-indigo-600 mb-4">Game Ended</h1>
          <p className="text-gray-600 mb-6">Thank you for playing Snake & Ladder!</p>
          <p className="text-gray-600 mb-8">Final Position: {finalPosition}</p>
          <button
            onClick={handleCloseTab}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Close Tab
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-100 to-indigo-100">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center">
        <h1 className="text-3xl font-bold text-indigo-600 mb-4">Snake & Ladder Game</h1>
        <p className="text-gray-600 mb-4">Player ID: {playerId}</p>
        <p className="text-gray-600 mb-4">Position: {currentPlayer?.position || 0}</p>
        {isConnecting && (
          <p className="text-blue-600 mb-4">Connecting to game server...</p>
        )}
        {error && (
          <p className="text-red-600 mb-4">{error}</p>
        )}
        
        {/* Dice Component */}
        <Dice onRoll={handleDiceRoll} />
      </div>
    </div>
  );
} 