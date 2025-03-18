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

// Special tile positions that will trigger spiritual questions
export const specialTilePositions = [
  6, 13, 23, 29, 35, 42, 47
];

// Helper functions
export const getGameElement = (position) => {
  return gameElements.find(element => element.start === position) || null;
};

export const isSpecialTile = (position) => {
  return specialTilePositions.includes(position);
};

// Function to calculate final position after a move
export const calculateFinalPosition = (currentPosition, diceValue) => {
  let newPosition = currentPosition + diceValue;
  let message = '';
  let requiresTask = false;
  
  if (newPosition > 50) {
    return {
      newPosition: currentPosition,
      message: '🛑 Cannot move beyond position 50!'
    };
  }
  
  if (isSpecialTile(newPosition)) {
    requiresTask = true;
    message = `✨ You landed on a special tile! Answer this spiritual question`;
  }
  
  const element = getGameElement(newPosition);
  if (element) {
    newPosition = element.end;
    message = element.type === 'snake' 
      ? `🐍 Oops! Snake at ${element.start} moves you down to ${element.end}`
      : `🪜 Yay! Ladder at ${element.start} takes you up to ${element.end}`;
  }

  return { newPosition, message, requiresTask }; 
};

// Add helper function for task result messages
export const formatTaskResultMessage = (isCorrect, moveAmount, fromPosition, toPosition) => {
  return isCorrect
    ? `✅ Answered spiritual question correctly! Moving forward ${moveAmount} tiles (${fromPosition} → ${toPosition})`
    : `❌ Answered spiritual question incorrectly. Moving back ${moveAmount} tiles (${fromPosition} → ${toPosition})`;
}; 