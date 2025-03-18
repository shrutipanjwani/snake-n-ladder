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
      <div className="leaderboard-container">
      <div className="leaderboard-content">
        <h1 className="leaderboard-title">
         The game of Life
        </h1>
        <div className="loading-state">
          <p className="loading-text">Waiting for game to start</p>
        </div>
      </div>
    </div>
    );
  }

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-content">
        <h1 className="leaderboard-title">
          The game of life
        </h1>

        <div className="leaderboard-card">
          <div className="overflow-x-auto">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th className="leaderboard-move-number" style={{ color: '#333', fontSize: "1rem" }}>
                    Move #
                  </th>
                  {gameState.players.map(player => (
                    <th 
                      key={player.id} 
                      className="leaderboard-player-header"
                    >
                      <div className="leaderboard-player-name">{player.name}</div>
                      <div className="leaderboard-player-position">
                        Current Position: {player.position}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {moveIndices.map(index => (
                  <tr key={index}>
                    <td className="leaderboard-move-number">
                      {index + 1}
                    </td>
                    {gameState.players.map(player => {
                      const move = movesHistory[player.id]?.[index];
                      return (
                        <td key={`${player.id}-${index}`}>
                          {move && (
                            <div className="move-details">
                              {move.diceValue > 0 && (
                                <>
                                  <div className="dice-roll">
                                    Rolled: {move.diceValue}
                                  </div>
                                  <div className="position-change">
                                    From: {move.previousPosition} → {move.newPosition}
                                  </div>
                                </>
                              )}
                              {move.message && (
                                <div className={`message ${
                                  move.message.includes('✅') 
                                    ? 'message-success'
                                    : move.message.includes('❌')
                                      ? 'message-error'
                                      : move.message.includes('QR code')
                                        ? 'message-info'
                                        : 'message-success'
                                }`}>
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
                      className="loading-text"
                      style={{ textAlign: 'center', padding: '1.5rem' }}
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
    </div>
  );
} 