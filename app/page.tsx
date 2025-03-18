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
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h2 className="login-title">Connecting to Server</h2>
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
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h2 className="login-title">Connection Error</h2>
          </div>
          <div className="card-content">
            <p className="error-message">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-wrapper">
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h2 className="card-title">The game of Life</h2>
          </div>
          <div className="card-content">
            <form onSubmit={handleJoinGame} className="login-form">
              <div className="form-group">
                <label className="form-label" htmlFor="playerName">Your Name</label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <input
                    id="playerName"
                    type="text"
                    className="form-input"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter your name"
                    required
                  />
                  <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                    Join Game
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
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
            <p>Game will start when 4 players have joined</p>
          </div>
        </div>
      </div>
    </div>
  );
}