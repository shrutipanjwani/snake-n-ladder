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

// Define positions that have QR codes
export const qrPositions: QRPosition[] = [
  { position: 5, taskId: 'task1' },
  { position: 12, taskId: 'task2' },
  { position: 18, taskId: 'task3' },
  { position: 25, taskId: 'task4' },
  { position: 31, taskId: 'task5' },
  { position: 38, taskId: 'task6' },
  { position: 42, taskId: 'task7' },
  { position: 45, taskId: 'task8' },
  { position: 47, taskId: 'task9' },
  { position: 49, taskId: 'task10' }
];

// Define snakes and ladders
export const snakesAndLadders: SnakeLadder[] = [
  { start: 15, end: 5, type: 'snake' },
  { start: 23, end: 16, type: 'snake' },
  { start: 37, end: 19, type: 'snake' },
  { start: 44, end: 28, type: 'snake' },
  { start: 8, end: 15, type: 'ladder' },
  { start: 21, end: 32, type: 'ladder' },
  { start: 28, end: 41, type: 'ladder' },
  { start: 36, end: 48, type: 'ladder' }
];

// Helper functions
export const hasQRCode = (position: number): string | null => {
  const qrSpot = qrPositions.find(qr => qr.position === position);
  return qrSpot ? qrSpot.taskId : null;
};

export const getSnakeOrLadder = (position: number): SnakeLadder | null => {
  return snakesAndLadders.find(sl => sl.start === position) || null;
};

// Calculate new position after a dice roll
export const calculateNewPosition = (currentPosition: number, diceRoll: number): number => {
  const newPosition = currentPosition + diceRoll;
  
  // Check if new position has a snake or ladder
  const snakeOrLadder = getSnakeOrLadder(newPosition);
  if (snakeOrLadder) {
    return snakeOrLadder.end;
  }
  
  // Ensure position doesn't exceed board size
  return Math.min(newPosition, 50);
}; 