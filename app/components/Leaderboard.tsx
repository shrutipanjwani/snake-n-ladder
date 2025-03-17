'use client';

import React from 'react';
import { Player, TaskResult } from '../lib/types';

interface LeaderboardProps {
  players: Player[];
  taskResult: TaskResult | null;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ players, taskResult }) => {
  // Sort players by position (highest first)
  const sortedPlayers = [...players].sort((a, b) => b.position - a.position);
  
  // Player colors (matching GameBoard)
  const playerColors = ['#FF5733', '#33FF57', '#3357FF', '#F033FF'];
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-indigo-600 text-white px-4 py-3">
        <h2 className="text-lg font-semibold">Leaderboard</h2>
      </div>
      
      <div className="divide-y divide-gray-200">
        {sortedPlayers.map((player, index) => {
          // Determine if this player had the most recent move
          const isRecentMove = taskResult && taskResult.playerId === player.id;
          
          return (
            <div 
              key={player.id} 
              className={`px-4 py-3 flex items-center ${isRecentMove ? 'bg-yellow-50' : ''}`}
            >
              <div className="mr-3 font-bold text-gray-700">{index + 1}.</div>
              
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-3"
                style={{ backgroundColor: playerColors[player.corner] }}
              >
                {player.name.charAt(0).toUpperCase()}
              </div>
              
              <div className="flex-grow">
                <div className="font-medium">{player.name}</div>
                <div className="text-sm text-gray-500">Tile: {player.position}/50</div>
              </div>
              
              {isRecentMove && (
                <div className={`text-sm font-medium ${taskResult.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {taskResult.isCorrect 
                    ? `+${taskResult.moveAmount} moves` 
                    : `${taskResult.moveAmount} moves`}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Leaderboard;