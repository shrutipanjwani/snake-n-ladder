'use client';

import React, { useState, useEffect } from 'react';
import { socket } from '../lib/socket';
import { useGameStore } from '../store/gameStore';
import { Player } from '../lib/types';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [waitingPlayers, setWaitingPlayers] = useState<Player[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const gameStore = useGameStore();

  useEffect(() => {
    // Check for existing admin session
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession === 'true') {
      setIsAdmin(true);
      setIsLoading(false);
      // Request admin status if we have a session
      socket.emit('adminConnect');
      
      // Load waiting players from localStorage
      const savedPlayers = localStorage.getItem('waitingPlayers');
      if (savedPlayers) {
        setWaitingPlayers(JSON.parse(savedPlayers));
      }
    } else {
      setIsLoading(false);
    }

    // Listen for admin connection confirmation
    socket.on('adminConnected', (data) => {
      console.log('Admin connection response:', data);
      if (data.success) {
        setIsAdmin(true);
        setError('');
        localStorage.setItem('adminSession', 'true');
      } else {
        setError(data.message || 'Failed to connect as admin');
        localStorage.removeItem('adminSession');
      }
    });

    // Listen for lobby updates
    socket.on('lobbyUpdate', (players: Player[]) => {
      console.log('Received lobby update:', players);
      setWaitingPlayers(players);
      localStorage.setItem('waitingPlayers', JSON.stringify(players));
    });

    // Listen for game started event
    socket.on('gameStarted', (data) => {
      console.log('Game started event received in admin:', data);
      // Clear waiting players from localStorage when game starts
      localStorage.removeItem('waitingPlayers');
      setWaitingPlayers([]);
      console.log('Waiting players cleared, current state:', waitingPlayers);
      // Update game store to reflect game is in progress
      gameStore.startGame(data.gameId, data.players);
    });

    // Listen for game ended event
    socket.on('gameEnded', () => {
      console.log('Game ended event received in admin');
      gameStore.resetGame();
    });

    // Listen for errors
    socket.on('error', (data) => {
      console.error('Socket error:', data);
      setError(data.message || 'An error occurred');
    });

    return () => {
      console.log('Cleaning up socket listeners in admin');
      socket.off('adminConnected');
      socket.off('lobbyUpdate');
      socket.off('gameStarted');
      socket.off('gameEnded');
      socket.off('error');
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === '123' && password === '123') {
      socket.emit('adminConnect');
    } else {
      setError('Invalid credentials. Use "123" for both username and password.');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('adminSession');
    localStorage.removeItem('waitingPlayers');
    socket.emit('adminDisconnect');
  };

  const handleStartGame = () => {
    if (waitingPlayers.length > 0) {
      console.log('Admin starting game with players:', waitingPlayers);
      socket.emit('adminStartGame');
    }
  };

  const handleEndGame = () => {
    console.log('Admin ending game');
    socket.emit('adminEndGame');
    gameStore.resetGame();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-md w-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <div className="text-xl font-semibold">Loading...</div>
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
            <div className="text-xl font-semibold text-red-600 mb-4">Error</div>
            <div className="text-gray-600">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-md w-96">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">Admin Login</h1>
            <p className="text-sm text-gray-500">Use "123" for both username and password</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-green-600">Connected as Admin</div>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Game Status</h2>
              <div className="space-y-2">
                <p>Game ID: {gameStore.gameId || 'No active game'}</p>
                <p>Players in game: {gameStore.players.length}</p>
                <p>Game in progress: {gameStore.isInGame ? 'Yes' : 'No'}</p>
              </div>
            </div>

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
                {waitingPlayers.length === 0 && (
                  <div className="text-gray-500 text-center py-4">
                    No players waiting
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleStartGame}
                disabled={waitingPlayers.length === 0}
                className={`px-4 py-2 rounded-md text-white ${
                  waitingPlayers.length > 0
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Start Game
              </button>
              
              <button
                onClick={handleEndGame}
                disabled={!gameStore.isInGame}
                className={`px-4 py-2 rounded-md text-white ${
                  gameStore.isInGame
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                End Game
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 