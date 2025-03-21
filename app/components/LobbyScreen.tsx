'use client';

import React, { useState, useEffect } from 'react';
import { socket } from '../lib/socket';
import { Player } from '../lib/types';
import { useGameStore } from '../store/gameStore';
import { useRouter } from 'next/navigation';

interface LobbyScreenProps {
  waitingPlayers: Player[];
  isJoined: boolean;
}

const LobbyScreen: React.FC<LobbyScreenProps> = ({ 
  waitingPlayers = [], // Provide default empty array
  isJoined = false 
}) => {
  const [playerName, setPlayerName] = useState('');
  const gameStore = useGameStore();
  const router = useRouter();
  
  useEffect(() => {
    // Listen for game start event
    socket.on('gameStart', (data) => {
      console.log('Game start received:', data);
      if (data.gameUrl) {
        router.push(data.gameUrl);
      }
    });

    // Listen for lobby updates
    socket.on('lobbyUpdate', (players: Player[]) => {
      gameStore.setLobbyPlayers(players);
    });

    return () => {
      socket.off('gameStart');
      socket.off('lobbyUpdate');
    };
  }, [gameStore, router]);

  const handleJoinLobby = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    // Set player name in game store first
    gameStore.setPlayerName(playerName);

    // Then emit join lobby event
    socket.emit('joinLobby', {
      name: playerName
    });
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
          Waiting Players ({waitingPlayers.length}):
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
      </div>
    </div>
  );
};

export default LobbyScreen;