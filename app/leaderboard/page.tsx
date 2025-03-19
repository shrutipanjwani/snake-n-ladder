'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import styles from './Leaderboard.module.css';

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
  winner?: {
    id: string;
    name: string;
    position: number;
  };
}

export default function LeaderboardPage() {
  const [gameState, setGameState] = useState<GameState>({ players: [] });
  const [socket, setSocket] = useState<Socket | null>(null);
  const [movesHistory, setMovesHistory] = useState<{[playerId: string]: Move[]}>({});
  const processedMoves = useRef<Set<string>>(new Set());
  const tableBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = io(process.env.NODE_ENV === 'development' ? `http://localhost:3000` : `https://snake-n-ladder-nine.vercel.app`, {
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('Connected to leaderboard');
      
      // Load saved state first
      const savedState = localStorage.getItem('leaderboardState');
      const savedMoves = localStorage.getItem('movesHistory');
      const savedProcessedMoves = localStorage.getItem('processedMoves');
      
      let hasExistingState = false;
      
      if (savedState && savedMoves && savedProcessedMoves) {
        const parsedState = JSON.parse(savedState);
        const parsedMoves = JSON.parse(savedMoves);
        const parsedProcessedMoves = JSON.parse(savedProcessedMoves);
        
        if (parsedState.players?.length > 0 && Object.keys(parsedMoves).length > 0) {
          setGameState(parsedState);
          setMovesHistory(parsedMoves);
          processedMoves.current = new Set(parsedProcessedMoves);
          hasExistingState = true;
        }
      }
      
      // Request current game state and merge with saved state
      socket.emit('requestGameState', { hasExistingState });
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
        setGameState(prevState => {
          const newState = {
            ...prevState,
            players: prevState.players.map(player =>
              player.id === data.playerId
                ? { ...player, position: data.lastMove?.to || player.position }
                : player
            )
          };
          localStorage.setItem('leaderboardState', JSON.stringify(newState));
          return newState;
        });

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
          
          const newHistory = {
            ...prev,
            [data.playerId as string]: [...playerMoves, newMove]
          };
          
          localStorage.setItem('movesHistory', JSON.stringify(newHistory));
          localStorage.setItem('processedMoves', JSON.stringify(Array.from(processedMoves.current)));
          
          return newHistory;
        });
      } else {
        // Handle non-task updates (like initial game state)
        setGameState(prevState => {
          const newState = {
            ...prevState,
            players: data.players || prevState.players
          };
          if (newState.players.length > 0) {
            localStorage.setItem('leaderboardState', JSON.stringify(newState));
          }
          return newState;
        });
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

        // Update history
        const newHistory = {
          ...prev,
          [data.playerId]: [...playerMoves, newMove]
        };
        
        // Save to localStorage
        localStorage.setItem('movesHistory', JSON.stringify(newHistory));
        localStorage.setItem('processedMoves', JSON.stringify(Array.from(processedMoves.current)));
        
        return newHistory;
      });

      // Update game state
      setGameState(prevState => {
        const newState = {
          ...prevState,
          players: prevState.players.map(player =>
            player.id === data.playerId
              ? { ...player, position: data.newPosition }
              : player
          )
        };
        localStorage.setItem('leaderboardState', JSON.stringify(newState));
        return newState;
      });
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
        
        // Clear localStorage
        localStorage.removeItem('leaderboardState');
        localStorage.removeItem('movesHistory');
        localStorage.removeItem('processedMoves');
      }
    });

    socket.on('playerWon', (data: { playerId: string, winnerName: string, finalPosition: number }) => {
      console.log('🏆 Player won:', data);
      // Update game state with winner information
      setGameState(prev => ({
        ...prev,
        winner: {
          id: data.playerId,
          name: data.winnerName,
          position: data.finalPosition
        },
        // Also update the player's position in the players array
        players: prev.players.map(player =>
          player.id === data.playerId
            ? { ...player, position: data.finalPosition }
            : player
        )
      }));

      // Save the updated state to localStorage
      localStorage.setItem('leaderboardState', JSON.stringify({
        ...gameState,
        winner: {
          id: data.playerId,
          name: data.winnerName,
          position: data.finalPosition
        }
      }));
    });

    // Add handler for receiving current game state
    socket.on('currentGameState', (data: { gameState: GameState, movesHistory: {[playerId: string]: Move[]}, processedMoves: string[] }) => {
      console.log('Received current game state:', data);
      if (data.gameState) {
        setGameState(data.gameState);
        // Also save to localStorage immediately
        localStorage.setItem('leaderboardState', JSON.stringify(data.gameState));
      }
      if (data.movesHistory) {
        setMovesHistory(data.movesHistory);
        localStorage.setItem('movesHistory', JSON.stringify(data.movesHistory));
      }
      if (data.processedMoves) {
        processedMoves.current = new Set(data.processedMoves);
        localStorage.setItem('processedMoves', JSON.stringify(Array.from(data.processedMoves)));
      }
    });

    setSocket(socket);

    return () => {
      console.log('Cleaning up socket connection');
      socket.disconnect();
    };
  }, []);

  // Load initial state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('leaderboardState');
    const savedMoves = localStorage.getItem('movesHistory');
    const savedProcessedMoves = localStorage.getItem('processedMoves');
    
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      setGameState(parsedState);
    }
    if (savedMoves) {
      setMovesHistory(JSON.parse(savedMoves));
    }
    if (savedProcessedMoves) {
      processedMoves.current = new Set(JSON.parse(savedProcessedMoves));
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (gameState.players.length > 0) {
      localStorage.setItem('leaderboardState', JSON.stringify(gameState));
    }
  }, [gameState]);

  useEffect(() => {
    localStorage.setItem('movesHistory', JSON.stringify(movesHistory));
  }, [movesHistory]);

  useEffect(() => {
    localStorage.setItem('processedMoves', JSON.stringify(Array.from(processedMoves.current)));
  }, [processedMoves.current]);

  // Add game ended listener
  useEffect(() => {
    const handleGameEnd = () => {
      localStorage.removeItem('leaderboardState');
      localStorage.removeItem('movesHistory');
      localStorage.removeItem('processedMoves');
      setGameState({ players: [] });
      setMovesHistory({});
      processedMoves.current.clear();
    };

    socket?.on('gameEnded', handleGameEnd);

    return () => {
      socket?.off('gameEnded', handleGameEnd);
    };
  }, [socket]);

  // Modify the initial loading check
  const savedState = typeof window !== 'undefined' ? localStorage.getItem('leaderboardState') : null;
  const hasGameState = gameState.players.length > 0 || (savedState && JSON.parse(savedState).players?.length > 0);

  // Safely calculate max moves
  const maxMoves = Math.max(...Object.values(movesHistory).map(moves => moves?.length ?? 0), 0);

  // Create array of move indices
  const moveIndices = Array.from({ length: maxMoves }, (_, i) => i);

  // Add effect to scroll to bottom when new moves are added
  useEffect(() => {
    if (tableBodyRef.current) {
      // Small delay to ensure content is rendered
      setTimeout(() => {
        if (tableBodyRef.current) {
          tableBodyRef.current.scrollTo({
            top: tableBodyRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [movesHistory, maxMoves]); // Also trigger on maxMoves changes

  if (!hasGameState) {
    return (
      <div className={styles.leaderboardContainer}>
        <div className={styles.leaderboardContent}>
          <h1 className={styles.leaderboardTitle}>
            The Game of Life
          </h1>
          <div className="loading-state">
            <p className="loading-text">Waiting for game to start</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.leaderboardContainer}>
      <div className={styles.leaderboardContent}>
        {/* <h1 className={styles.leaderboardTitle}>
          The Game of Life
        </h1> */}

        {(gameState.winner || gameState.players.some(p => p.position >= 50)) && (
          <div className={styles.winnerCard}>
            <h2 className={styles.winnerTitle}>
              Game Over! 🎉
            </h2>
            <p className={styles.winnerName}>
              {gameState.winner?.name || gameState.players.find(p => p.position >= 50)?.name} has won the game!
            </p>
            <p className={styles.winnerPosition}>
              Final Position: {gameState.winner?.position || 50}/50
            </p>
          </div>
        )}

        <div className={styles.tableContainer}>
          <div className={styles.tableHeader}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className="leaderboard-move-number" style={{ color: '#333', fontSize: "1rem", padding: "1rem" }}>
                    Move #
                  </th>
                  {gameState.players.map(player => (
                    <th 
                      key={player.id} 
                      className="leaderboard-player-header"
                      style={{ padding: "1rem" }}
                    >
                      <div className="leaderboard-player-name">{player.name}</div>
                      <div className="leaderboard-player-position">
                        Current Position: {player.position}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
            </table>
          </div>

          <div className={styles.tableBody} ref={tableBodyRef}>
            <table className={styles.table}>
              <tbody>
                {moveIndices.map(index => (
                  <tr key={index}>
                    <td className="leaderboard-move-number" style={{ padding: "1rem" }}>
                      {index + 1}
                    </td>
                    {gameState.players.map(player => {
                      const move = movesHistory[player.id]?.[index];
                      return (
                        <td key={`${player.id}-${index}`} style={{ padding: "1rem" }}>
                          {move && (
                            <div className="move-details">
                              {move.diceValue > 0 && (
                                <>
                                  <div className="dice-roll">
                                    🎲 Rolled: {move.diceValue}
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