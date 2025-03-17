'use client';

import React from 'react';
import { Player } from '../lib/types';

interface GameBoardProps {
  players: Player[];
  currentPlayerId: string;
}

const GameBoard: React.FC<GameBoardProps> = ({ players, currentPlayerId }) => {
  // Constants for board size
  const boardSize = 600; // pixels
  const tilesPerSide = 8; // tiles per side (not including center)
  const tileSize = boardSize / (tilesPerSide * 2); // pixel size of each tile
  
  // Corner coordinates (starting positions)
  const corners = [
    { x: 0, y: 0 }, // top-left
    { x: boardSize - tileSize, y: 0 }, // top-right
    { x: 0, y: boardSize - tileSize }, // bottom-left
    { x: boardSize - tileSize, y: boardSize - tileSize }, // bottom-right
  ];
  
  // Center coordinates (goal)
  const centerX = boardSize / 2 - tileSize / 2;
  const centerY = boardSize / 2 - tileSize / 2;
  
  // Colors for each player
  const playerColors = ['#FF5733', '#33FF57', '#3357FF', '#F033FF'];
  
  // Function to calculate player position on board
  const getPlayerPosition = (player: Player) => {
    if (player.position === 0) {
      // Starting position (corner)
      return corners[player.corner];
    } else if (player.position >= 50) {
      // Reached the center (goal)
      return { x: centerX, y: centerY };
    } else {
      // Calculate intermediate position based on player's progress
      // This is a simplified calculation - you may want to refine this
      // to match your physical board layout
      const corner = corners[player.corner];
      const progress = player.position / 50;
      
      // Move from corner towards center
      return {
        x: corner.x + (centerX - corner.x) * progress,
        y: corner.y + (centerY - corner.y) * progress
      };
    }
  };
  
  return (
    <div className="relative w-full max-w-xl mx-auto aspect-square bg-indigo-50 border-2 border-indigo-200 rounded-lg shadow-lg">
      {/* Center (Home) */}
      <div 
        className="absolute bg-yellow-200 border border-yellow-400 rounded-md flex items-center justify-center text-lg font-bold text-yellow-800"
        style={{
          left: centerX,
          top: centerY,
          width: tileSize * 2,
          height: tileSize * 2,
          zIndex: 10
        }}
      >
        HOME
      </div>
      
      {/* Player tokens */}
      {players.map((player) => {
        const position = getPlayerPosition(player);
        return (
          <div
            key={player.id}
            className="absolute rounded-full flex items-center justify-center font-bold text-white shadow-md transition-all duration-500"
            style={{
              left: position.x,
              top: position.y,
              width: tileSize,
              height: tileSize,
              backgroundColor: playerColors[player.corner],
              border: player.id === currentPlayerId ? '3px solid white' : 'none',
              zIndex: 20,
              transform: player.id === currentPlayerId ? 'scale(1.1)' : 'scale(1)'
            }}
          >
            {player.name.charAt(0).toUpperCase()}
          </div>
        );
      })}
    </div>
  );
};

export default GameBoard;