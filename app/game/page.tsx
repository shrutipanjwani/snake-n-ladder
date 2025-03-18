'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '../lib/socket';
import { useGameStore } from '../store/gameStore';
import { Player, TaskResult } from '../lib/types';
import GameBoard from '../components/GameBoard';
import Leaderboard from '../components/Leaderboard';
import TaskScreen from '../components/TaskScreen';

export default function GamePage() {
  const router = useRouter();
  const { 
    isInGame,
    gameId,
    players,
    currentTask,
    taskResult,
    winner,
    isGameOver,
    updateGameState,
    endGame,
    resetGame
  } = useGameStore();
  
  // Get current player's ID
  const currentPlayerId = getSocket().id as string;
  
  // Set up socket listeners
  useEffect(() => {
    if (!isInGame || !gameId) {
      router.push('/');
      return;
    }
    
    const socket = getSocket();
    
    // Listen for game updates
    socket.on('gameUpdate', (data: { players: Player[], taskResult: TaskResult }) => {
      updateGameState(data.players, data.taskResult);
    });
    
    // Listen for game over
    socket.on('gameOver', (data: { winner: Player }) => {
      endGame(data.winner);
    });
    
    // Listen for player disconnection
    socket.on('playerDisconnected', (data: { playerId: string, playerName: string }) => {
      // Here we could show a notification that a player left
      console.log(`${data.playerName} disconnected.`);
    });
    
    // Cleanup listeners
    return () => {
      socket.off('gameUpdate');
      socket.off('gameOver');
      socket.off('playerDisconnected');
    };
  }, [isInGame, gameId, router, updateGameState, endGame]);
  
  // Handle game reset and return to lobby
  const handleReturnToLobby = () => {
    resetGame();
    router.push('/');
  };
  
  // If not in game, redirect to home
  if (!isInGame && !isGameOver) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-100 to-purple-100 py-4 px-4">
      <div className="container mx-auto">
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-bold text-indigo-800">Nirankari Snake and Ladder</h1>
        </div>
        
        {isGameOver ? (
          // Game over screen
          <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold text-indigo-600 mb-4">🎉 Game Over! 🎉</h2>
            <p className="text-xl mb-6">
              <span className="font-medium">{winner?.name}</span> has won the game!
            </p>
            <button
              onClick={handleReturnToLobby}
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
            >
              Return to Lobby
            </button>
          </div>
        ) : (
          // Active game screen
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Leaderboard */}
            <div>
              <Leaderboard players={players} taskResult={taskResult} />
            </div>
            
            {/* Middle column - Game board */}
            <div className="lg:col-span-2 flex flex-col">
              <GameBoard players={players} currentPlayerId={currentPlayerId} />
              
              {/* Task or QR Scanner */}
              <div className="mt-6">
                {currentTask && (
                  <TaskScreen task={currentTask} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}