// src/lib/types.ts

export interface LastMove {
  from: number;
  to: number;
  value: number;
}

export interface Player {
  id: string;
  name: string;
  position: number;
  corner: number; // 0, 1, 2, or 3 - corresponds to the corner they start from
  hasWon?: boolean;
  isActive?: boolean;
  lastMove?: LastMove;
}

export interface Task {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index of the correct option
  moveForward: number;
  moveBackward: number;
}

export interface TaskResult {
  playerId: string;
  isCorrect: boolean;
  moveAmount: number;
  newPosition: number;
}

export interface GameState {
  gameId: string | null;
  players: Player[];
  currentPlayer: Player | null;
  isInLobby: boolean;
  isInGame: boolean;
  isGameOver: boolean;
  winner: Player | null;
  currentTask: Task | null;
  taskResult: TaskResult | null;
  isHydrated: boolean;
  isGameStarted: boolean;
}

export interface QRCodeData {
  taskId: string;
}