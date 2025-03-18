'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Dice from '@/app/components/Dice';
import { Socket } from 'socket.io-client';
import { getTaskById } from '@/app/store/tasks';
import { socket as globalSocket, initializeSocket } from '@/app/lib/socket';

interface Task {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  moveForward: number;
  moveBackward: number;
}

interface GameState {
  currentPosition: number;
  diceValue: number | null;
  message?: string;
  currentTask: Task | null;
  taskId: string | null;
  isGameWon: boolean;
  winner: {
    winnerId: string;
    winnerName: string;
    finalPosition: number;
  } | null;
}

export default function GamePage() {
  const params = useParams();
  const playerId = params.playerId as string;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [finalPosition, setFinalPosition] = useState(0);
  const [isConnecting, setIsConnecting] = useState(true);
  const [gameState, setGameState] = useState<GameState>({
    currentPosition: 0,
    diceValue: null,
    message: '',
    currentTask: null,
    taskId: null,
    isGameWon: false,
    winner: null
  });
  
  const socketRef = useRef<Socket | null>(null);
  const hasGameEndedRef = useRef(false);

  useEffect(() => {
    // Initialize socket connection using the global socket
    const socketInstance = initializeSocket();
    setSocket(socketInstance);
    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      console.log('Connected to game server');
      setIsConnecting(false);
    });

    // Handle dice roll results
    socketInstance.on('diceRollResult', (data: {
      playerId: string;
      value: number;
      newPosition: number;
      message?: string;
      task?: {
        taskId: string;
        question: string;
        options: string[];
        moveForward: number;
        moveBackward: number;
      } | null;
    }) => {
      if (data.playerId === playerId) {
        console.log('Dice roll result:', data);
        
        // If we received a task, show it immediately
        if (data.task && data.task.taskId) {
          const { taskId, question, options, moveForward, moveBackward } = data.task;
          setGameState(prev => ({
            ...prev,
            currentPosition: data.newPosition,
            currentTask: {
              id: taskId,
              question,
              options,
              moveForward,
              moveBackward,
              correctAnswer: 0 // This will be checked server-side
            },
            taskId,
            message: undefined // Don't show any message when showing task
          }));
        } else {
          // Normal position update without task
          setGameState(prev => ({
            ...prev,
            currentPosition: data.newPosition,
            currentTask: null,
            taskId: null,
            message: data.message
          }));
        }
      }
    });

    // Handle task completion results
    socketInstance.on('taskCompleted', (data: {
      playerId: string;
      success: boolean;
      newPosition: number;
      moveForward: number;
      moveBackward: number;
    }) => {
      if (data.playerId === playerId) {
        console.log('Task completed:', data);
        
        // Create detailed message about movement
        const resultMessage = data.success 
          ? `✅ Correct answer! Moving forward ${data.moveForward} tiles.`
          : `❌ Incorrect answer. Moving back ${data.moveBackward} tiles.`;
        
        // Update game state with new position and message
        setGameState(prev => ({
          ...prev,
          currentPosition: data.newPosition,
          currentTask: null,
          taskId: null,
          message: resultMessage
        }));

        // Clear the result message after 2 seconds
        setTimeout(() => {
          setGameState(prev => ({
            ...prev,
            message: undefined
          }));
        }, 2000);

        // Emit game state update to sync leaderboard
        socket?.emit('updateGameState', {
          playerId,
          position: data.newPosition,
          lastMove: {
            from: gameState.currentPosition,
            to: data.newPosition,
            message: resultMessage
          }
        });
      }
    });

    // Handle game end
    socketInstance.on('gameEnded', (data: { winner?: { id: string; name: string }, adminEnded?: boolean }) => {
      console.log('Game ended:', data);
      
      // Only end the game if it was ended by admin
      if (data.adminEnded) {
        setGameEnded(true);
        hasGameEndedRef.current = true;
        
        // Clear local storage only when admin ends the game
        localStorage.removeItem(`gameState_${playerId}`);
        
        // Update game state to show winner
        const winner = data?.winner;
        if (winner?.id && winner?.name) {
          const isCurrentPlayer = winner.id === playerId;
          setGameState(prev => ({
            ...prev,
            isGameWon: true,
            diceValue: null,
            currentTask: null,
            winner: {
              winnerId: winner.id,
              winnerName: isCurrentPlayer ? 'You' : winner.name,
              finalPosition: prev.currentPosition
            }
          }));
          setFinalPosition(isCurrentPlayer ? 1 : 0);
        }
      }
    });

    // Listen for player won event
    socketInstance.on('playerWon', (data: { playerId: string, winnerName: string, finalPosition: number }) => {
      console.log('🏆 Player won:', data);
      const isCurrentPlayer = data.playerId === playerId;
      
      // Update game state to show winner but don't end the game
      setGameState(prev => ({
        ...prev,
        isGameWon: true,
        diceValue: null,
        currentTask: null,
        winner: {
          winnerId: data.playerId,
          winnerName: isCurrentPlayer ? 'You' : data.winnerName,
          finalPosition: data.finalPosition
        }
      }));

      // Save state to localStorage
      const newState = {
        ...gameState,
        isGameWon: true,
        winner: {
          winnerId: data.playerId,
          winnerName: isCurrentPlayer ? 'You' : data.winnerName,
          finalPosition: data.finalPosition
        }
      };
      localStorage.setItem(`gameState_${playerId}`, JSON.stringify(newState));
    });

    return () => {
      console.log('Cleaning up socket connection');
      socketInstance.disconnect();
    };
  }, [playerId]);

  // Load initial state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(`gameState_${playerId}`);
    if (savedState) {
      setGameState(JSON.parse(savedState));
    }
  }, [playerId]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(`gameState_${playerId}`, JSON.stringify(gameState));
  }, [gameState, playerId]);

  // Clear localStorage when game ends
  useEffect(() => {
    if (gameState.isGameWon) {
      localStorage.removeItem(`gameState_${playerId}`);
    }
  }, [gameState.isGameWon, playerId]);

  // Clear localStorage when component unmounts
  useEffect(() => {
    return () => {
      localStorage.removeItem(`gameState_${playerId}`);
    };
  }, [playerId]);

  // Handle dice roll
  const handleRollDice = () => {
    if (!socket || gameEnded) return;
    
    const value = Math.floor(Math.random() * 6) + 1;
    console.log('Rolling dice:', value);
    socket.emit('rollDice', { playerId, value });
  };
  // Handle task answer
  const handleTaskAnswer = (answer: number) => {
    if (!socket || !gameState.currentTask) return;
    
    const task = gameState.currentTask;
    
    console.log('Submitting answer:', {
      playerId,
      taskId: task.id,
      answer,
      currentPosition: gameState.currentPosition
    });
    
    // Emit task completion event
    socket.emit('taskCompleted', {
      playerId,
      taskId: task.id,
      answer,
      isCorrect: answer === task.correctAnswer
    });
  };

  // Render game content based on state
  const renderGameContent = () => {
    if (gameState.isGameWon) {
      return (
        <div className="text-center py-8">
          <div className="bg-green-100 rounded-lg p-6 mb-6">
            <h2 className="text-3xl font-bold text-green-800 mb-4">
              🎉 Game Over! 🎉
            </h2>
            <p className="text-xl text-green-700 mb-2">
              {gameState.winner?.winnerId === playerId 
                ? "Congratulations! You've won the game!" 
                : `${gameState.winner?.winnerName} has won the game!`}
            </p>
            <p className="text-green-600">
              Final Position: {gameState.winner?.finalPosition}/50
            </p>
          </div>
        </div>
      );
    }

    if (gameState.currentTask) {
      return (
        <div className="task-section p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4 text-indigo-800">Answer the Spiritual Question</h2>
          <p className="text-lg mb-6">{gameState.currentTask.question}</p>
          <div className="space-y-4 flex flex-col gap-4">
            {gameState.currentTask.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleTaskAnswer(index)}
                className="w-full p-4 text-left bg-gray-50 hover:bg-indigo-50 rounded-lg transition-colors duration-200 ease-in-out border border-gray-200 hover:border-indigo-300 relative group"
              >
                <span className="block">{option}</span>
                <span className="absolute inset-y-0 right-4 flex items-center opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600">
                  →
                </span>
              </button>
            ))}
          </div>
          <div className="mt-8 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              Correct answer moves you forward {gameState.currentTask.moveForward} tiles.
              <br />
              Incorrect answer moves you back {gameState.currentTask.moveBackward} tiles.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="dice-section">
        <Dice onRoll={handleRollDice} disabled={gameEnded} />
        {gameState.message && (
          <p className="mt-4 text-sm text-gray-600 animate-fade-in">{gameState.message}</p>
        )}
      </div>
    );
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
            <p className="game-description">Thank you for playing The Game of Life!</p>
            
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
          <h1 className="card-title">The Game of Life</h1>
        </div>

        <div className="card-content">
          <div className="game-info mb-4">
            <h2 className="text-xl font-bold">Player</h2>
            <p className="text-md">ID: {playerId}</p>
            <p className="text-md font-semibold">Position: {gameState.currentPosition}/50</p>
          </div>
          
          {renderGameContent()}
        
        </div>
      </div>
    </div>
  );
} 