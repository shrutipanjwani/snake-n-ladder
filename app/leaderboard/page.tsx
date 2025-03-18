'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface Move {
  diceValue: number;
  previousPosition: number;
  newPosition: number;
  message?: string;
  timestamp: number;
  moveId?: string;
}

interface Player {
  id: string;
  name: string;
  position: number;
  moves: Move[];
}

interface GameState {
  players: Player[];
  lastMove?: {
    from: number;
    to: number;
    message: string;
  };
  isTaskResult?: boolean;
  playerId?: string;
  position?: number;
}

export default function LeaderboardPage() {
  const [gameState, setGameState] = useState<GameState>({ players: [] });
  const [socket, setSocket] = useState<Socket | null>(null);
  const [movesHistory, setMovesHistory] = useState<{[playerId: string]: Move[]}>({});
  const processedMoves = useRef<Set<string>>(new Set());

  useEffect(() => {
    const socket = io('http://localhost:3000', {
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('Connected to leaderboard');
    });

    socket.on('gameStateUpdate', (data: GameState) => {
      console.log('Game state update:', data);
      
      // If this is a task result, update the game state and moves history
      if (data.isTaskResult && data.playerId && data.lastMove) {
        // Generate a unique move ID for the task result
        const moveId = `task-${data.playerId}-${Date.now()}`;
        
        // Check if we've already processed this move
        if (processedMoves.current.has(moveId)) {
          console.log('Task result already processed:', moveId);
          return;
        }

        // Add move to processed set
        processedMoves.current.add(moveId);

        // Update game state with new position
        setGameState(prevState => ({
          ...prevState,
          players: prevState.players.map(player =>
            player.id === data.playerId
              ? { ...player, position: data.lastMove?.to || player.position }
              : player
          )
        }));

        // Add task result as a new move in history
        setMovesHistory(prev => {
          const playerMoves = prev[data.playerId as string] || [];
          
          // Create new move for task result
          const newMove: Move = {
            diceValue: 0,
            previousPosition: data.lastMove?.from || 0,
            newPosition: data.lastMove?.to || 0,
            message: data.lastMove?.message || '',
            timestamp: Date.now(),
            moveId
          };
          
          return {
            ...prev,
            [data.playerId as string]: [...playerMoves, newMove]
          };
        });
      } else {
        // Handle non-task updates (like initial game state)
        setGameState(prevState => ({
          ...prevState,
          players: data.players || prevState.players
        }));
      }
    });

    socket.on('diceRollResult', (data) => {
      console.log('Dice roll update:', data);
      
      // Generate a unique move ID
      const moveId = `${data.playerId}-${data.value}-${data.newPosition}-${Date.now()}`;
      
      // Check if we've already processed this move
      if (processedMoves.current.has(moveId)) {
        console.log('Move already processed:', moveId);
        return;
      }

      // Add move to processed set
      processedMoves.current.add(moveId);

      setMovesHistory(prev => {
        const playerMoves = prev[data.playerId] || [];
        const lastMove = playerMoves[playerMoves.length - 1];
        const previousPosition = lastMove ? lastMove.newPosition : 0;

        // Create new move
        const newMove: Move = {
          diceValue: data.value,
          previousPosition: previousPosition,
          newPosition: data.newPosition,
          message: data.message,
          timestamp: Date.now(),
          moveId
        };

        // Return updated history
        return {
          ...prev,
          [data.playerId]: [...playerMoves, newMove]
        };
      });

      // Update game state
      setGameState(prevState => ({
        ...prevState,
        players: prevState.players.map(player =>
          player.id === data.playerId
            ? { ...player, position: data.newPosition }
            : player
        )
      }));
    });

    socket.on('gameStarted', (data) => {
      console.log('Game started:', data);
      if (data?.players) {
        const initialMovesHistory: {[playerId: string]: Move[]} = {};
        const initialPlayers = data.players.map((player: { id: string; name: string }) => ({
          ...player,
          position: 0
        }));
        
        initialPlayers.forEach((player: { id: string; name: string; position: number }) => {
          initialMovesHistory[player.id] = [];
        });
        
        // Clear processed moves on game start
        processedMoves.current.clear();
        setMovesHistory(initialMovesHistory);
        setGameState({ players: initialPlayers });
      }
    });

    setSocket(socket);

    return () => {
      console.log('Cleaning up socket connection');
      socket.disconnect();
    };
  }, []);

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
                            {move.diceValue > 0 && (
                              <>
                                <div className="font-medium">
                                  Rolled: {move.diceValue}
                                </div>
                                <div className="text-indigo-600">
                                  From: {move.previousPosition} → {move.newPosition}
                                </div>
                              </>
                            )}
                            {move.message && (
                              <div className={`${
                                move.message.includes('✅') 
                                  ? 'text-green-600'
                                  : move.message.includes('❌')
                                    ? 'text-red-600'
                                    : move.message.includes('QR code')
                                      ? 'text-blue-600'
                                      : 'text-green-600'
                              } ${move.diceValue === 0 ? 'text-base font-medium' : 'text-sm'}`}>
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