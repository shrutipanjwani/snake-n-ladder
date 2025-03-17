// src/store/gameStore.ts
import { create } from 'zustand';
import { getSocket } from '../lib/socket';
import { GameState, Player, Task, TaskResult } from '../lib/types';

interface GameStore extends GameState {
  // Player actions
  setPlayerName: (name: string) => void;
  joinGame: () => void;
  resetGame: () => void;
  answerTask: (taskId: string, answer: number) => void;
  
  // Game state updates
  setLobbyPlayers: (players: Player[]) => void;
  startGame: (gameId: string, players: Player[]) => void;
  updateGameState: (players: Player[], taskResult: TaskResult | null) => void;
  endGame: (winner: Player) => void;
  setCurrentTask: (task: Task | null) => void;
}

// Initial state
const initialState: GameState = {
  gameId: null,
  players: [],
  isInLobby: false,
  isInGame: false,
  isGameOver: false,
  winner: null,
  currentTask: null,
  taskResult: null,
};

// Create the store
export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,
  
  // Set player name and join lobby
  setPlayerName: (name: string) => {
    const socket = getSocket();
    const playerId = socket.id as string;
    set({ 
      players: [{ id: playerId, name, position: 0, corner: -1 }],
      isInLobby: true 
    });
  },
  
  // Join the game lobby
  joinGame: () => {
    const socket = getSocket();
    const state = get();
    if (state.players.length > 0) {
      socket.emit('joinLobby', { name: state.players[0].name });
    }
  },
  
  // Reset the game state
  resetGame: () => {
    set(initialState);
  },
  
  // Answer a task from QR code
  answerTask: (taskId: string, answer: number) => {
    const socket = getSocket();
    socket.emit('qrScanned', { taskId, answer });
    set({ currentTask: null }); // Clear current task after answering
  },
  
  // Update lobby players
  setLobbyPlayers: (players: Player[]) => {
    set({ players });
  },
  
  // Start a new game
  startGame: (gameId: string, players: Player[]) => {
    set({ 
      gameId,
      players,
      isInLobby: false,
      isInGame: true
    });
  },
  
  // Update game state after a move
  updateGameState: (players: Player[], taskResult: TaskResult | null) => {
    set({ 
      players,
      taskResult
    });
  },
  
  // End the game with a winner
  endGame: (winner: Player) => {
    set({ 
      isGameOver: true,
      isInGame: false,
      winner
    });
  },
  
  // Set current task from QR scan
  setCurrentTask: (task: Task | null) => {
    set({ currentTask: task });
  }
}));