'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { socket, initializeSocket } from './lib/socket';
import { useGameStore } from './store/gameStore';
import { Player } from './lib/types';

export default function Home() {
  const [playerName, setPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [waitingPlayers, setWaitingPlayers] = useState<Player[]>([]);
  const gameStore = useGameStore();
  const router = useRouter();

  useEffect(() => {
    const socketInstance = initializeSocket();

    const handleConnect = () => {
      console.log('Connected to server');
      setIsLoading(false);
      setError('');
    };

    const handleConnectError = (error: Error) => {
      console.error('Connection error:', error);
      setError('Failed to connect to server. Please check if the server is running.');
      setIsLoading(false);
    };

    const handleDisconnect = () => {
      console.log('Disconnected from server');
      setIsLoading(true);
    };

    socketInstance.on('connect', handleConnect);
    socketInstance.on('connect_error', handleConnectError);
    socketInstance.on('disconnect', handleDisconnect);

    socketInstance.on('lobbyUpdate', (players: Player[]) => {
      console.log('Received lobby update:', players);
      setWaitingPlayers(players);
    });

    socketInstance.on('gameStart', (data) => {
      console.log('Received game start:', data);
      gameStore.startGame(data.gameId, data.players);
      if (data.gameUrl) {
        router.push(data.gameUrl);
      }
    });

    socketInstance.on('redirectToGame', (data) => {
      console.log('Redirecting to game:', data);
      router.push(`/game/${data.playerId}`);
    });

    return () => {
      socketInstance.off('connect', handleConnect);
      socketInstance.off('connect_error', handleConnectError);
      socketInstance.off('disconnect', handleDisconnect);
      socketInstance.off('lobbyUpdate');
      socketInstance.off('gameStart');
      socketInstance.off('redirectToGame');
    };
  }, []);

  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      socket.emit('playerConnect', playerName.trim());
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-md w-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <div className="text-xl font-semibold">Connecting to server...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-md w-96">
          <div className="text-center">
            <div className="text-xl font-semibold text-red-600 mb-4">Connection Error</div>
            <div className="text-gray-600">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
          <h1 className="text-2xl font-bold mb-6">Snake & Ladder Game</h1>
          
          <form onSubmit={handleJoinGame} className="mb-8">
            <div className="flex gap-4">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
              <button
                type="submit"
                className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Join Game
              </button>
            </div>
          </form>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Waiting Players ({waitingPlayers.length})</h2>
            <div className="space-y-2">
              {waitingPlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex justify-between items-center bg-white p-3 rounded shadow"
                >
                  <span>{player.name}</span>
                  <span>ID: #{player.id.slice(-4)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}