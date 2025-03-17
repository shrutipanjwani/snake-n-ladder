'use client';

import React, { useState, useEffect } from 'react';
import { socket } from '../lib/socket';
import { Player } from '../lib/types';
import { useGameStore } from '../store/gameStore';

interface LobbyScreenProps {
  waitingPlayers: Player[];
  isJoined: boolean;
}

const LobbyScreen: React.FC<LobbyScreenProps> = ({ 
  waitingPlayers = [], // Provide default empty array
  isJoined = false 
}) => {
  const [playerName, setPlayerName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const gameStore = useGameStore();
  
  useEffect(() => {
    // Check if this is the first player (admin)
    if (waitingPlayers.length === 1 && waitingPlayers[0]?.id === gameStore.currentPlayer?.id) {
      setIsAdmin(true);
    }
  }, [waitingPlayers, gameStore.currentPlayer]);

  const handleJoinLobby = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    socket.emit('joinLobby', {
      name: playerName
    });
  };

  const handleStartGame = () => {
    if (waitingPlayers.length === 4) {
      socket.emit('adminStartGame');
    }
  };

  const handleEndGame = () => {
    socket.emit('adminEndGame');
    gameStore.resetGame();
  };
  
  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
      <h1 className="text-2xl font-bold mb-4">Game Lobby</h1>
      
      {!isJoined && (
        <form onSubmit={handleJoinLobby} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Player Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Enter your name"
            />
          </div>
          
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Join Game
          </button>
        </form>
      )}

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">
          Waiting Players ({waitingPlayers.length}/4):
        </h2>
        <ul className="space-y-2">
          {waitingPlayers.map((player) => (
            <li
              key={player.id}
              className="bg-gray-50 p-2 rounded-md flex justify-between items-center"
            >
              <span>{player.name}</span>
              <span className="text-sm text-gray-500">#{player.id.slice(-4)}</span>
            </li>
          ))}
        </ul>

        {isAdmin && waitingPlayers.length === 4 && (
          <button
            onClick={handleStartGame}
            className="mt-4 w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Start Game
          </button>
        )}

        {isAdmin && gameStore.isInGame && (
          <button
            onClick={handleEndGame}
            className="mt-2 w-full py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            End Game
          </button>
        )}
      </div>
    </div>
  );
};

export default LobbyScreen;