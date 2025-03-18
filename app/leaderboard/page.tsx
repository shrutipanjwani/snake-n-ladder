'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Move {
  diceValue: number;
  previousPosition: number;  // Track previous position
  newPosition: number;
  message?: string;
}

interface Player {
  id: string;
  name: string;
  position: number;
  moves: Move[];
}

interface GameState {
  players: Player[];
}

export default function LeaderboardPage() {
  const [gameState, setGameState] = useState<GameState>({
    players: []
  });
  const [socket, setSocket] = useState<Socket | null>(null);
  const [movesHistory, setMovesHistory] = useState<{[playerId: string]: Move[]}>({});

  useEffect(() => {
    const socket = io('http://localhost:3000', {
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('Connected to leaderboard');
    });

    socket.on('gameStateUpdate', (data: GameState) => {
      console.log('Game state update:', data);
      if (data?.players) {
        setGameState(data);
      }
    });

    socket.on('diceRollResult', (data) => {
      console.log('Dice roll update:', data);
      
      // Get current position before updating
      const currentPlayer = gameState.players.find(p => p.id === data.playerId);
      const currentPosition = currentPlayer?.position ?? 0;

      // Update moves history with the new move
      setMovesHistory(prev => {
        const playerMoves = prev[data.playerId] || [];
        const newMove = {
          diceValue: data.value,
          previousPosition: currentPosition,  // Use current position as previous
          newPosition: data.newPosition,
          message: data.message
        };
        console.log('Adding move for player:', data.playerId, newMove);
        return {
          ...prev,
          [data.playerId]: [...playerMoves, newMove]
        };
      });

      // Update game state to reflect new position
      setGameState(prevState => ({
        ...prevState,
        players: (prevState.players || []).map(player =>
          player.id === data.playerId
            ? { ...player, position: data.newPosition }
            : player
        )
      }));
    });

    socket.on('gameStarted', (data) => {
      console.log('Game started:', data);
      if (data?.players) {
        // Initialize moves history for all players
        const initialMovesHistory: {[playerId: string]: Move[]} = {};
        data.players.forEach((player: Player) => {
          initialMovesHistory[player.id] = [];
        });
        setMovesHistory(initialMovesHistory);
        setGameState({ players: data.players });
      }
    });

    setSocket(socket);

    return () => {
      socket.disconnect();
    };
  }, [gameState.players]); // Add dependency to access current player positions

  // Safely calculate max moves
  const maxMoves = Math.max(...Object.values(movesHistory).map(moves => moves?.length ?? 0), 0);

  // Create array of move indices
  const moveIndices = Array.from({ length: maxMoves }, (_, i) => i);

  // Safe check for players array
  if (!gameState?.players?.length) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-indigo-100 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-indigo-600 mb-8 text-center">
            Snake & Ladder Leaderboard
          </h1>
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-gray-600">Waiting for game to start...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-indigo-100 p-4">
      <div className="max-w-[95%] mx-auto">
        <h1 className="text-3xl font-bold text-indigo-600 mb-6 text-center">
          Snake & Ladder Leaderboard
        </h1>
        
        <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-indigo-100">
                <th className="p-4 text-left font-semibold text-indigo-700 border-b border-indigo-200 min-w-[80px]">
                  Move #
                </th>
                {gameState.players.map(player => (
                  <th 
                    key={player.id} 
                    className="p-4 text-left font-semibold text-indigo-700 border-b border-indigo-200"
                    style={{ minWidth: '200px' }}
                  >
                    <div className="text-lg">{player.name}</div>
                    <div className="text-sm text-indigo-500 mt-1">
                      Current Position: {player.position}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {moveIndices.map(index => (
                <tr 
                  key={index} 
                  className={`border-b border-indigo-100 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-indigo-50'
                  }`}
                >
                  <td className="p-4 font-medium text-indigo-600">
                    {index + 1}
                  </td>
                  {gameState.players.map(player => {
                    const move = movesHistory[player.id]?.[index];
                    return (
                      <td key={`${player.id}-${index}`} className="p-4">
                        {move && (
                          <div className="space-y-2">
                            <div className="font-medium">
                              Rolled: {move.diceValue}
                            </div>
                            <div className="text-indigo-600">
                              From: {move.previousPosition} → {move.newPosition}
                            </div>
                            {move.message && (
                              <div className="text-sm text-green-600">
                                {move.message}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {maxMoves === 0 && Object.keys(movesHistory).length === 0 && (
                <tr>
                  <td 
                    colSpan={gameState.players.length + 1} 
                    className="p-6 text-center text-gray-500"
                  >
                    Game started! Waiting for first move...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 