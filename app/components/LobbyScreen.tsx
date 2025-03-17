'use client';

import React, { useState } from 'react';
import { Player } from '../lib/types';
import { useGameStore } from '../store/gameStore';

interface LobbyScreenProps {
  waitingPlayers: Player[];
  isJoined: boolean;
}

const LobbyScreen: React.FC<LobbyScreenProps> = ({ waitingPlayers, isJoined }) => {
  const [playerName, setPlayerName] = useState('');
  const setPlayerNameAndJoin = useGameStore(state => state.setPlayerName);
  const joinGame = useGameStore(state => state.joinGame);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      setPlayerNameAndJoin(playerName);
      joinGame();
    }
  };
  
  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-indigo-600 text-white p-6 text-center">
        <h1 className="text-2xl font-bold">Nirankari Youth Symposium</h1>
        <h2 className="text-lg mt-1">Spiritual Snake and Ladder Game</h2>
      </div>
      
      <div className="p-6">
        {!isJoined ? (
          <div>
            <p className="text-gray-600 mb-4 text-center">
              Enter your name to join the game. The game will start when 4 players have joined.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your name"
                  required
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Join Game
              </button>
            </form>
          </div>
        ) : (
          <div>
            <p className="text-center font-medium text-lg mb-2">
              Waiting for players...
            </p>
            <p className="text-center text-gray-600 mb-6">
              {waitingPlayers.length}/4 players have joined
            </p>
            
            <div className="space-y-2">
              {waitingPlayers.map((player, index) => (
                <div 
                  key={player.id}
                  className="p-3 border rounded-md bg-indigo-50 flex items-center"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold mr-3">
                    {index + 1}
                  </div>
                  <span className="font-medium">{player.name}</span>
                </div>
              ))}
              
              {/* Empty slots */}
              {Array.from({ length: Math.max(0, 4 - waitingPlayers.length) }).map((_, index) => (
                <div 
                  key={`empty-${index}`}
                  className="p-3 border rounded-md border-dashed flex items-center text-gray-400"
                >
                  <div className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center mr-3">
                    {waitingPlayers.length + index + 1}
                  </div>
                  <span>Waiting for player...</span>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center text-gray-600">
              Game will start automatically when 4 players have joined
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LobbyScreen;