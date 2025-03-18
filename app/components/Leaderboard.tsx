'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '@/app/store/gameStore';
import { io } from 'socket.io-client';

interface MoveHistory {
  playerId: string;
  value: number;
  previousPosition: number;
  newPosition: number;
  timestamp: number;
  message?: string;
}

interface Player {
  id: string;
  name: string;
  position: number;
}

interface DiceRollResult {
  value: number;
  newPosition: number;
  hasWon: boolean;
  playerId?: string;
}

export default function Leaderboard() {
  const { players, updatePlayerPosition } = useGameStore();
  const [moveHistory, setMoveHistory] = useState<MoveHistory[]>([]);
  const [socket, setSocket] = useState<any>(null);
  const [localPlayers, setLocalPlayers] = useState<Player[]>(players);
  
  // Use refs to track current state without triggering re-renders
  const playersRef = useRef(players);
  playersRef.current = players;

  // Debug logging for state changes
  useEffect(() => {
    console.log('Players from store changed:', players);
  }, [players]);

  useEffect(() => {
    console.log('Local players updated:', localPlayers);
  }, [localPlayers]);

  useEffect(() => {
    console.log('Move history updated:', moveHistory);
  }, [moveHistory]);

  // Sync local players with store
  useEffect(() => {
    console.log('Players updated:', players);
    setLocalPlayers(players);
  }, [players]);

  // Socket connection and event listeners
  useEffect(() => {
    console.log('Setting up socket connection...');
    const newSocket = io('http://localhost:3000', {
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Socket connected successfully');
    });

    // Handle dice roll result
    newSocket.on('diceRollResult', (data: { 
      playerId: string; 
      value: number; 
      newPosition: number;
      message?: string;
    }) => {
      console.log('Dice roll result received:', data);
      
      // Get current player state
      const currentPlayers = playersRef.current;
      const player = currentPlayers.find(p => p.id === data.playerId);
      
      if (!player) {
        console.warn('Player not found:', data.playerId);
        return;
      }

      // Create move history entry
      const newMove: MoveHistory = {
        playerId: data.playerId,
        value: data.value,
        previousPosition: player.position,
        newPosition: data.newPosition,
        timestamp: Date.now(),
        message: data.message
      };

      console.log('Adding move to history:', newMove);

      // Update move history
      setMoveHistory(prev => [...prev, newMove]);

      // Update local players
      setLocalPlayers(currentPlayers => 
        currentPlayers.map(p => 
          p.id === data.playerId 
            ? { ...p, position: data.newPosition }
            : p
        )
      );

      // Update global store
      updatePlayerPosition(data.playerId, data.newPosition);
    });

    setSocket(newSocket);

    return () => {
      console.log('Cleaning up socket connection');
      newSocket.disconnect();
    };
  }, [updatePlayerPosition]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-indigo-600 mb-4">Leaderboard</h2>
      <div className="space-y-4">
        {localPlayers.map((player) => {
          const playerMoves = moveHistory.filter(move => move.playerId === player.id);
          const lastMove = playerMoves[playerMoves.length - 1];
          
          return (
            <div key={player.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{player.name}</h3>
                <span className="text-indigo-600 font-bold">
                  Position: {player.position}
                </span>
              </div>
              
              {lastMove && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>Last roll: {lastMove.value}</p>
                  <p>Moved from {lastMove.previousPosition} to {lastMove.newPosition}</p>
                  {lastMove.message && (
                    <p className="text-indigo-600 font-medium mt-1">{lastMove.message}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}