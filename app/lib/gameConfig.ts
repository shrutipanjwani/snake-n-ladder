// Types for game board elements
interface QRPosition {
  position: number;
  taskId: string;
}

interface SnakeLadder {
  start: number;
  end: number;
  type: 'snake' | 'ladder';
}

// Game board configuration
export interface GameElement {
  start: number;
  end: number;
  type: 'snake' | 'ladder';
}

// Snake and ladder positions
export const gameElements: GameElement[] = [
  // Snakes (move backward)
  { start: 48, end: 26, type: 'snake' },
  { start: 43, end: 17, type: 'snake' },
  { start: 39, end: 19, type: 'snake' },
  { start: 34, end: 11, type: 'snake' },
  { start: 25, end: 4, type: 'snake' },
  
  // Ladders (move forward)
  { start: 3, end: 22, type: 'ladder' },
  { start: 8, end: 31, type: 'ladder' },
  { start: 16, end: 36, type: 'ladder' },
  { start: 20, end: 41, type: 'ladder' },
  { start: 28, end: 45, type: 'ladder' }
];

// QR code positions with associated tasks
export const qrPositions: QRPosition[] = [
  { position: 6, taskId: 'task1' },
  { position: 13, taskId: 'task2' },
  { position: 23, taskId: 'task3' },
  { position: 29, taskId: 'task4' },
  { position: 35, taskId: 'task5' },
  { position: 42, taskId: 'task6' },
  { position: 47, taskId: 'task7' }
];

// Helper functions
export const getGameElement = (position: number): GameElement | null => {
  return gameElements.find(element => element.start === position) || null;
};

export const hasQRCode = (position: number): QRPosition | null => {
  return qrPositions.find(qr => qr.position === position) || null;
};

// Function to calculate final position after a move
export const calculateFinalPosition = (currentPosition: number, diceValue: number): {
  newPosition: number;
  message: string;
} => {
  // First calculate the new position after dice roll
  let newPosition = currentPosition + diceValue;
  let message = '';
  
  // Don't exceed board limit
  if (newPosition > 50) {
    return {
      newPosition: currentPosition,
      message: '🛑 Cannot move beyond position 50!'
    };
  }
  
  // Check for snake or ladder
  const element = getGameElement(newPosition);
  if (element) {
    newPosition = element.end;
    message = element.type === 'snake' 
      ? `🐍 Oops! Snake at ${element.start} moves you down to ${element.end}`
      : `🪜 Yay! Ladder at ${element.start} takes you up to ${element.end}`;
  }
  
  return { newPosition, message };
}; 