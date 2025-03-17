'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { socket, getSocket } from '../../lib/socket';
import { useGameStore } from '../../store/gameStore';
import { Player } from '../../lib/types';

export default function PlayerGame() {
  const params = useParams();
  const router = useRouter();
  const { currentPlayer, gameId } = useGameStore();
  
  console.log('PlayerGame Component Mounted:', {
    params,
    currentPlayer,
    gameId,
    socketId: socket.id
  });

  const [gameState, setGameState] = useState({
    currentPosition: 0,
    showQRScanner: false,
    lastRoll: null as number | null,
    canRoll: true,
  });

  // Handle initial state and reconnection
  useEffect(() => {
    const socket = getSocket();
    
    // If we have persisted state but socket changed, reconnect
    if (currentPlayer && gameId && currentPlayer.id !== socket.id) {
      socket.emit('rejoinGame', {
        gameId,
        player: currentPlayer
      });
    }
  }, [currentPlayer, gameId]);

  // Redirect if not in a game or wrong player
  useEffect(() => {
    console.log('Navigation Check:', {
      gameId,
      currentPlayer,
      paramsPlayerId: params.playerId,
      socketId: socket.id
    });

    if (!gameId || !currentPlayer) {
      console.log('No game or player - redirecting to lobby');
      router.push('/');
      return;
    }

    if (params.playerId !== currentPlayer.id) {
      console.log('Wrong player page - redirecting to correct page', {
        current: params.playerId,
        should: currentPlayer.id
      });
      router.push(`/game/${currentPlayer.id}`);
      return;
    }

    console.log('Player page validated - staying on current page');
  }, [gameId, currentPlayer, params.playerId, router]);

  useEffect(() => {
    // Listen for game updates
    socket.on('gameUpdate', (data: { player: Player, position: number }) => {
      if (data.player.id === params.playerId) {
        setGameState(prev => ({
          ...prev,
          currentPosition: data.position
        }));
      }
    });

    // Listen for QR scan requirements
    socket.on('requireQRScan', (data: { playerId: string, position: number, taskId: string }) => {
      if (data.playerId === params.playerId) {
        setGameState(prev => ({
          ...prev,
          showQRScanner: true,
          canRoll: false
        }));
      }
    });

    // Listen for task completion
    socket.on('taskCompleted', (data: { playerId: string, success: boolean }) => {
      if (data.playerId === params.playerId) {
        setGameState(prev => ({
          ...prev,
          showQRScanner: false,
          canRoll: true
        }));
      }
    });

    return () => {
      socket.off('gameUpdate');
      socket.off('requireQRScan');
      socket.off('taskCompleted');
    };
  }, [params.playerId]);

  const handleRollDice = () => {
    if (!gameState.canRoll || !currentPlayer) return;
    
    const roll = Math.floor(Math.random() * 6) + 1;
    setGameState(prev => ({ ...prev, lastRoll: roll }));
    
    socket.emit('rollDice', {
      playerId: currentPlayer.id,
      roll: roll
    });
  };

  const handleQRScanned = (qrData: string) => {
    if (!currentPlayer) return;
    
    try {
      const data = JSON.parse(qrData);
      socket.emit('qrScanned', {
        playerId: currentPlayer.id,
        taskId: data.taskId
      });
    } catch (error) {
      console.error('Invalid QR code data:', error);
    }
  };

  // Show loading state while checking game/player status
  if (!currentPlayer || !gameId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-semibold">Loading game...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-indigo-100 p-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Player: {currentPlayer.name}</h1>
        <div className="mb-6">
          <p className="text-lg">Current Position: {gameState.currentPosition}/50</p>
          {gameState.lastRoll && (
            <p className="text-md text-gray-600">Last Roll: {gameState.lastRoll}</p>
          )}
        </div>

        <div className="space-y-4">
          {gameState.canRoll && !gameState.showQRScanner && (
            <button
              onClick={handleRollDice}
              className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Roll Dice
            </button>
          )}

          {gameState.showQRScanner && (
            <div className="text-center">
              <p className="text-lg font-medium mb-2">Scan QR Code</p>
              {/* Add your QR Scanner component here */}
              <button
                onClick={() => handleQRScanned('{"taskId":"task1"}')} // Temporary for testing
                className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Simulate QR Scan
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 