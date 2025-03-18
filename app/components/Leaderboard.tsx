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
    newSocket.on('diceRollResult', (data: { playerId: string; value: number; newPosition: number }) => {
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
        timestamp: Date.now()
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

  // Group moves by player for display
  const movesByPlayer = moveHistory.reduce((acc, move) => {
    if (!acc[move.playerId]) {
      acc[move.playerId] = [];
    }
    acc[move.playerId].push(move);
    return acc;
  }, {} as Record<string, MoveHistory[]>);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden p-4">
      <h2 className="text-2xl font-bold text-center mb-6">Game History</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-indigo-600 text-white">
              <th className="px-4 py-2">Move #</th>
              {localPlayers.map(player => (
                <th key={player.id} className="px-4 py-2">
                  <div>{player.name}</div>
                  <div className="text-sm">
                    Current: {player.position}
                    {player.id === moveHistory[moveHistory.length - 1]?.playerId && (
                      <span className="ml-2 text-yellow-300">
                        (Last Move)
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {moveHistory
              .reduce((acc, move) => {
                const existing = acc.find(row => Math.abs(row.timestamp - move.timestamp) < 1000);
                if (existing) {
                  existing.moves[move.playerId] = move;
                } else {
                  acc.push({
                    timestamp: move.timestamp,
                    moves: { [move.playerId]: move }
                  });
                }
                return acc;
              }, [] as Array<{ timestamp: number, moves: Record<string, MoveHistory> }>)
              .map((row, index, array) => (
                <tr key={row.timestamp} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-4 py-2 text-center font-medium">{array.length - index}</td>
                  {localPlayers.map(player => {
                    const move = row.moves[player.id];
                    return (
                      <td key={player.id} className="px-4 py-2 border">
                        {move ? (
                          <div className="text-sm">
                            <div className="font-medium text-green-600">
                              Rolled: {move.value}
                            </div>
                            <div className="text-gray-600">
                              {move.previousPosition} → {move.newPosition}
                            </div>
                          </div>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))
              .reverse()}
          </tbody>
        </table>
      </div>
    </div>
  );
}