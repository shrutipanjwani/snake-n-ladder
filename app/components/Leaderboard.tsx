'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '@/app/store/gameStore';
import { io } from 'socket.io-client';
import { Player, TaskResult } from '../lib/types';

interface MoveHistory {
  playerId: string;
  value: number;
  previousPosition: number;
  newPosition: number;
  timestamp: number;
  message?: string;
  isTaskResult?: boolean;
  lastMove?: {
    from: number;
    to: number;
    message: string;
    isTaskResult?: boolean;
  };
}

interface GameStateUpdate {
  playerId: string;
  position: number;
  lastMove: {
    from: number;
    to: number;
    message: string;
  };
  isTaskResult?: boolean;
}

interface LeaderboardProps {
  players: Player[];
  taskResult: TaskResult | null;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ players, taskResult }) => {
  const { updatePlayerPosition } = useGameStore();
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
    console.log("Socket URL (from env):", process.env.NEXT_PUBLIC_SOCKET_URL);

    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL  || "http://localhost:3000", {
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Socket connected successfully');
    });

    // Handle game state updates (including task results)
    newSocket.on('gameStateUpdate', (data: GameStateUpdate) => {
      console.log('Game state update received:', data);
      
      // Only create move history for task completion if it's not already recorded
      if (data.isTaskResult) {
        const existingTaskMove = moveHistory.find(move => 
          move.isTaskResult && 
          move.playerId === data.playerId && 
          move.timestamp > Date.now() - 5000 // Check within last 5 seconds
        );

        if (!existingTaskMove) {
          const newMove: MoveHistory = {
            playerId: data.playerId,
            value: 0,
            previousPosition: data.lastMove.from,
            newPosition: data.lastMove.to,
            timestamp: Date.now(),
            lastMove: {
              ...data.lastMove,
              isTaskResult: true
            }
          };

          setMoveHistory(prev => [...prev, newMove]);
        }
      }
      
      // Update local players
      setLocalPlayers(currentPlayers => 
        currentPlayers.map(p => 
          p.id === data.playerId 
            ? { ...p, position: data.position }
            : p
        )
      );

      // Update global store
      updatePlayerPosition(data.playerId, data.position);
    });

    // Handle dice roll result
    newSocket.on('diceRollResult', (data: any) => {
      console.log('Dice roll result received:', data);
      
      const player = playersRef.current.find(p => p.id === data.playerId);
      if (!player) return;

      const newMove: MoveHistory = {
        playerId: data.playerId,
        value: data.value,
        previousPosition: player.position,
        newPosition: data.newPosition,
        timestamp: Date.now(),
        message: data.message,
        lastMove: data.lastMove
      };

      setMoveHistory(prev => [...prev, newMove]);
      
      setLocalPlayers(currentPlayers => 
        currentPlayers.map(p => 
          p.id === data.playerId 
            ? { ...p, position: data.newPosition }
            : p
        )
      );

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
      <h2 className="text-2xl font-bold text-indigo-600 mb-4">The game of Life</h2>
      <div className="space-y-4">
        {localPlayers.map((player) => {
          const playerMoves = moveHistory.filter(move => move.playerId === player.id);
          const lastMove = playerMoves[playerMoves.length - 1];
          
          return (
            <div key={player.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">{player.name}</h3>
                <span className="text-indigo-600 font-bold">
                  Current Position: {player.position}
                </span>
              </div>
              
              {lastMove && (
                <div className="mt-2">
                  {/* Task Result Message */}
                  {lastMove.lastMove?.isTaskResult && (
                    <div className={`p-3 rounded-lg ${
                      lastMove.lastMove.message.includes('✅') 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      <div className="font-medium">
                        {lastMove.lastMove.message}
                      </div>
                      <div className="text-sm mt-1 opacity-75">
                        Position changed: {lastMove.lastMove.from} → {lastMove.lastMove.to}
                      </div>
                    </div>
                  )}
                  
                  {/* Regular Move Message */}
                  {!lastMove.lastMove?.isTaskResult && (
                    <div className="bg-blue-50 text-blue-700 border border-blue-200 p-3 rounded-lg">
                      <div className="font-medium">
                        🎲 Rolled a {lastMove.value}
                      </div>
                      <div className="text-sm mt-1 opacity-75">
                        Moved from position {lastMove.previousPosition} to {lastMove.newPosition}
                      </div>
                      {lastMove.message && (
                        <div className="text-sm mt-1 font-medium">
                          {lastMove.message}
                        </div>
                      )}
                    </div>
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

export default Leaderboard;