'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Dice from '@/app/components/Dice';
import { io, Socket } from 'socket.io-client';
import { getTaskById } from '@/app/store/tasks';

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
  requiresQR: boolean;
  taskId?: string;
  isAnsweringTask: boolean;
  currentTask?: Task;
  message?: string;
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
    requiresQR: false,
    isAnsweringTask: false
  });
  
  const socketRef = useRef<Socket | null>(null);
  const hasGameEndedRef = useRef(false);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:3000', {
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Connected to game server');
      setIsConnecting(false);
      socketRef.current = newSocket;
    });

    // Handle dice roll results
    newSocket.on('diceRollResult', (data: {
      playerId: string;
      value: number;
      newPosition: number;
      message?: string;
      requiresQR?: boolean;
      taskId?: string;
    }) => {
      if (data.playerId === playerId) {
        console.log('Dice roll result:', data);
        
        // Check if message indicates a QR code
        const isQRCode = data.message?.includes('Found a QR code at position');
        
        // If QR code is found, immediately select a random task
        if (isQRCode) {
          const taskIds = ['task1', 'task2', 'task3', 'task4', 'task5'];
          const randomTaskId = taskIds[Math.floor(Math.random() * taskIds.length)];
          const task = getTaskById(randomTaskId);
          
          setGameState(prev => ({
            ...prev,
            currentPosition: data.newPosition,
            requiresQR: true,
            taskId: randomTaskId,
            isAnsweringTask: true,
            currentTask: task,
            message: data.message
          }));
        } else {
          // Normal position update
          setGameState(prev => ({
            ...prev,
            currentPosition: data.newPosition,
            requiresQR: false,
            message: data.message
          }));
        }
      }
    });

    // Handle task completion results
    newSocket.on('taskCompleted', (data: {
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
          requiresQR: false,
          isAnsweringTask: false,
          taskId: undefined,
          currentTask: undefined,
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
    newSocket.on('gameEnded', (data: { winner?: { id: string; name: string } }) => {
      console.log('Game ended:', data);
      setGameEnded(true);
      hasGameEndedRef.current = true;
      if (data.winner) {
        setFinalPosition(data.winner.id === playerId ? 1 : 0);
      }
    });

    setSocket(newSocket);

    return () => {
      console.log('Cleaning up socket connection');
      newSocket.disconnect();
    };
  }, [playerId]);

  // Handle dice roll
  const handleRollDice = () => {
    if (!socket || gameEnded) return;
    
    const value = Math.floor(Math.random() * 6) + 1;
    console.log('Rolling dice:', value);
    socket.emit('rollDice', { playerId, value });
  };

  // Handle QR code scan (now used for testing with random tasks)
  const handleQRScan = () => {};

  // Handle task answer
  const handleTaskAnswer = (answer: number) => {
    if (!socket || !gameState.taskId || !gameState.currentTask) return;
    
    const task = gameState.currentTask;
    const isCorrect = answer === task.correctAnswer;
    
    console.log('Submitting answer:', {
      playerId,
      taskId: gameState.taskId,
      answer,
      isCorrect,
      currentPosition: gameState.currentPosition,
      moveForward: task.moveForward,
      moveBackward: task.moveBackward
    });
    
    socket.emit('qrScanned', {
      playerId,
      taskId: gameState.taskId,
      answer,
      isCorrect,
      currentPosition: gameState.currentPosition,
      moveForward: task.moveForward,
      moveBackward: task.moveBackward
    });
  };

  // Render game content based on state
  const renderGameContent = () => {
    if (gameState.requiresQR && gameState.currentTask) {
      return (
        <div className="task-section p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Question</h2>
          <p className="text-lg mb-6">{gameState.currentTask.question}</p>
          <div className="space-y-4 flex flex-col gap-4">
            {gameState.currentTask.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleTaskAnswer(index)}
                className="w-full p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 ease-in-out border border-gray-200 relative group"
              >
                <span className="block">{option}</span>
                <span className="absolute inset-y-0 right-4 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
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
            <p className="game-description">Thank you for playing the game of Life!</p>
            
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
          <h1 className="card-title">The game of Life</h1>
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