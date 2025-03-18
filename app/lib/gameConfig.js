// Game board configuration
export const gameElements = [
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
export const qrPositions = [
  { position: 6, taskId: 'task1' },
  { position: 13, taskId: 'task2' },
  { position: 23, taskId: 'task3' },
  { position: 29, taskId: 'task4' },
  { position: 35, taskId: 'task5' },
  { position: 42, taskId: 'task6' },
  { position: 47, taskId: 'task7' }
];

// Helper functions
export const getGameElement = (position) => {
  return gameElements.find(element => element.start === position) || null;
};

export const hasQRCode = (position) => {
  return qrPositions.find(qr => qr.position === position) || null;
};

// Function to calculate final position after a move
export const calculateFinalPosition = (currentPosition, diceValue) => {
  // First calculate the new position after dice roll
  let newPosition = currentPosition + diceValue;
  let message = '';
  let requiresQR = false;
  let taskId = undefined;
  
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

  // Check for QR code
  const qrCode = hasQRCode(newPosition);
  if (qrCode) {
    requiresQR = true;
    taskId = qrCode.taskId;
    message = `📱 Found a QR code at position ${newPosition}! Scan to answer the question.`;
  }
  
  return { newPosition, message, requiresQR, taskId }; 
}; 