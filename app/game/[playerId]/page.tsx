'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useGameStore } from '@/app/store/gameStore';
import Dice from '@/app/components/Dice';
import { io, Socket } from 'socket.io-client';
import Leaderboard from '@/app/components/Leaderboard';

export default function GamePage() {
  const params = useParams();
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
          const oldPosition = currentPlayer?.position || 0;
          
          // Update the game state
          startGame(gameId, currentPlayer ? [{ 
            ...currentPlayer, 
            position: data.newPosition,
            lastMove: {
              from: oldPosition,
              to: data.newPosition,
              value: data.value
            }
          }] : []);

          // Emit the state update to all clients
          socket.emit('updateGameState', {
            playerId,
            gameId,
            position: data.newPosition,
            lastMove: {
              from: oldPosition,
              to: data.newPosition,
              value: data.value
            }
          });

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
      <div className="game-container">
        <div className="card game-ended-card">
          <div className="card-content text-center">
            <div className="game-result-icon">🏆</div>
            <h1 className="game-title">Game Ended</h1>
            <p className="game-description">Thank you for playing Snake & Ladder!</p>
            
            <div className="stat-card" style={{ margin: '2rem auto' }}>
              <div className="stat-header">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span className="stat-title">Final Position</span>
              </div>
              <div className="stat-value">{finalPosition}</div>
            </div>
            
            <button onClick={handleCloseTab} className="btn btn-primary" style={{ width: '100%' }}>
              Close Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="card game-card">
        <div className="card-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 2l-4 5-4-5"></path>
            <path d="M8.5 14v0"></path>
            <path d="M12 14v0"></path>
            <path d="M15.5 14v0"></path>
          </svg>
          <h1 className="card-title">Snake & Ladder Game</h1>
        </div>
        

        <div className="card-content">
          <div className="game-info">
            <div className="game-player">
              <div className="player-details">
                <h2 className="player-name">{currentPlayer?.name || 'Player'}</h2>
                <span className="player-id">ID: {playerId.slice(-6)}</span>
              </div>
            </div>
            
            <div className="game-progress">
              <div className="progress-label">
                <span>Position: {currentPlayer?.position || 0}/50</span>
              
              </div>
              
            </div>

            {isConnecting && (
              <div className="status-message status-connecting">
                <div className="spinner-small"></div>
                <span>Connecting to game server...</span>
              </div>
            )}
            
            {error && (
              <div className="status-message status-error">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{error}</span>
              </div>
            )}
          </div>
          
          <div className="dice-container">
            <Dice onRoll={handleDiceRoll} />
          </div>
          
          <div className="game-instructions">
            <h3 className="instructions-title">How to Play:</h3>
            <p>1. Roll the dice to move along the board</p>
            <p>2. Land on a QR code tile to answer a spiritual question</p>
            <p>3. Correct answers move you forward, incorrect answers move you back</p>
            <p>4. First player to reach position 50 (center) wins!</p>
          </div>

        <div className="flex justify-center">
          <Dice onRoll={handleDiceRoll} />

        </div>
      </div>
    </div>
  );
} 