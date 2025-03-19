// Game board configuration
export const gameElements = [
  // Snakes (move backward)
  { start: 48, end: 2, type: 'snake' },  
  { start: 31, end: 15, type: 'snake' },  
  { start: 21, end: 7, type: 'snake' }, 
  
  // Ladders (move forward)
  { start: 33, end: 45, type: 'ladder' }, 
  { start: 4, end: 19, type: 'ladder' },
  { start: 22, end: 36, type: 'ladder' }, 
];

// Special tile positions that will trigger spiritual questions
export const specialTilePositions = [
  9, 17, 29, 44  // Black tiles with gift boxes
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
  
  if (newPosition > 49) {
    return {
      newPosition: currentPosition,
      message: '🛑 Cannot move beyond position 49!'
    };
  }
  
  if (isSpecialTile(newPosition)) {
    requiresTask = true;
    message = `🎁 You landed on a special tile! Answer the question`;
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
    ? `✅ Correct answer! Moving forward ${moveAmount} tiles (${fromPosition} → ${toPosition})`
    : `❌ Incorrect answer. Moving back ${moveAmount} tiles (${fromPosition} → ${toPosition})`;
}; 