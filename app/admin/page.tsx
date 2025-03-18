'use client';

import React, { useState, useEffect } from 'react';
import { socket } from '../lib/socket';
import { useGameStore } from '../store/gameStore';
import { Player } from '../lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h2 className="login-title">Loading</h2>
          </div>
          <div className="spinner-container">
            <div className="spinner"></div>
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
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h2 className="login-title">Admin Login</h2>
            <p className="login-subtitle">Enter your credentials to access the admin panel</p>
          </div>
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
              />
            </div>
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              Login
            </button>
          </form>
          <div className="login-footer">
            <p>Use "123" for both username and password</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-wrapper">
        <div className="admin-header">
          <h1 className="admin-title">The game of Life Admin Panel</h1>
          <button onClick={handleLogout} className="btn btn-outline">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout
          </button>
        </div>
        
        <div className="stats-grid">
          {/* Game ID Card */}
          <div className="stat-card">
            <div className="stat-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="9" x2="20" y2="9"></line>
                <line x1="4" y1="15" x2="20" y2="15"></line>
                <line x1="10" y1="3" x2="8" y2="21"></line>
                <line x1="16" y1="3" x2="14" y2="21"></line>
              </svg>
              <span className="stat-title">Game ID</span>
            </div>
            <div className="stat-value">
              {gameStore.gameId ? `${gameStore.gameId.slice(-6)}` : 'No Active Game'}
            </div>
          </div>

          {/* Players Count Card */}
          <div className="stat-card">
            <div className="stat-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span className="stat-title">Players in Game</span>
            </div>
            <div className="stat-value">{gameStore.players.length}</div>
          </div>

          {/* Game Status Card */}
          <div className="stat-card">
            <div className="stat-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
              <span className="stat-title">Game Status</span>
            </div>
            <div>
              <span className={gameStore.isInGame ? "badge badge-success" : "badge badge-neutral"}>
                {gameStore.isInGame ? 'In Progress' : 'Not Started'}
              </span>
            </div>
          </div>
        </div>

        {/* Waiting Players */}
        <div className="card">
          <div className="card-header">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <h2 className="card-title">Waiting Players ({waitingPlayers.length})</h2>
          </div>
          <div className="card-content">
            {waitingPlayers.length > 0 ? (
              <div className="player-list">
                {waitingPlayers.map((player) => (
                  <div key={player.id} className="player-item">
                    <span className="player-name">{player.name}</span>
                    <span className="player-id">ID: #{player.id.slice(-4)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-players">
                No players waiting
              </div>
            )}
          </div>
          <div className="card-footer">
            <button
              onClick={handleStartGame}
              disabled={waitingPlayers.length === 0}
              className="btn btn-secondary"
              style={{ opacity: waitingPlayers.length === 0 ? 0.5 : 1 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="10 8 16 12 10 16 10 8"></polygon>
              </svg>
              Start Game
            </button>
            
            <button
              onClick={handleEndGame}
              disabled={!gameStore.isInGame}
              className="btn btn-danger"
              style={{ opacity: !gameStore.isInGame ? 0.5 : 1 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <rect x="9" y="9" width="6" height="6"></rect>
              </svg>
              End Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 