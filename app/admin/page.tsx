'use client';

import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { socket } from '../lib/socket';
import { useAdminStore } from '../store/adminStore';

export default function AdminDashboard() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { isAuthenticated, login, logout } = useAdminStore();
  const gameStore = useGameStore();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(username, password);
    if (!success) {
      setError('Invalid credentials');
    }
  };

  const handleStartGame = () => {
    if (gameStore.players.length === 4) {
      socket.emit('adminStartGame');
    }
  };

  const handleEndGame = () => {
    socket.emit('adminEndGame');
    gameStore.resetGame();
  };

  const handleClearStorage = () => {
    localStorage.removeItem('game-storage');
    window.location.reload();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
          <div>
            <h2 className="text-center text-3xl font-extrabold text-gray-900">
              Admin Login
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="text-red-500 text-center">{error}</div>
            )}
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Username"
                />
              </div>
              <div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-800"
            >
              Logout
            </button>
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
              <h2 className="text-xl font-semibold mb-4">Players</h2>
              <div className="space-y-2">
                {gameStore.players.map((player) => (
                  <div
                    key={player.id}
                    className="flex justify-between items-center bg-white p-3 rounded shadow"
                  >
                    <span>{player.name}</span>
                    <span>Position: {player.position}/50</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleStartGame}
                disabled={gameStore.players.length !== 4}
                className={`px-4 py-2 rounded-md text-white ${
                  gameStore.players.length === 4
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

              <button
                onClick={handleClearStorage}
                className="px-4 py-2 rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
              >
                Clear Storage
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 