// src/store/gameStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getSocket } from '../lib/socket';
import { GameState, Player, Task, TaskResult } from '../lib/types';

interface GameStore extends GameState {
  currentPlayer: Player | null;
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
  currentPlayer: null,
  isInLobby: false,
  isInGame: false,
  isGameOver: false,
  winner: null,
  currentTask: null,
  taskResult: null,
};

// Create the store with persistence
export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => {
      // Set up socket listener for game start
      const socket = getSocket();
      
      // Reconnect logic
      socket.on('connect', () => {
        const state = get();
        if (state.currentPlayer && socket.id) {
          // Update the player's socket ID after reconnection
          const updatedPlayer = { ...state.currentPlayer, id: socket.id };
          set({ currentPlayer: updatedPlayer });
          
          // If in game, rejoin the game
          if (state.isInGame && state.gameId) {
            socket.emit('rejoinGame', {
              gameId: state.gameId,
              player: updatedPlayer
            });
          }
          // If in lobby, rejoin the lobby
          else if (state.isInLobby) {
            socket.emit('joinLobby', {
              name: updatedPlayer.name,
              id: updatedPlayer.id
            });
          }
        }
      });

      socket.on('gameStart', (data: { gameId: string, player: Player, gameUrl: string }) => {
        console.log('Game Start Event Received:', {
          gameId: data.gameId,
          playerId: data.player.id,
          playerName: data.player.name,
          gameUrl: data.gameUrl
        });

        // First update the state
        set({ 
          gameId: data.gameId,
          currentPlayer: data.player,
          players: [data.player],
          isInLobby: false,
          isInGame: true
        });

        // Wait for state to be persisted before redirecting
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = data.gameUrl;
          }
        }, 100);
      });

      return {
        ...initialState,
        
        setPlayerName: (name: string) => {
          const socket = getSocket();
          if (!socket.id) return;
          
          const newPlayer = { id: socket.id, name, position: 0, corner: -1 };
          set({ 
            currentPlayer: newPlayer,
            players: [newPlayer],
            isInLobby: true 
          });
        },

        // Rest of your store methods...
        joinGame: () => {
          const socket = getSocket();
          const state = get();
          if (state.currentPlayer) {
            socket.emit('joinLobby', { 
              name: state.currentPlayer.name,
              id: state.currentPlayer.id 
            });
          }
        },

        resetGame: () => {
          set(initialState);
        },

        // ... rest of your existing methods ...
        answerTask: (taskId: string, answer: number) => {
          const socket = getSocket();
          const state = get();
          if (state.currentPlayer) {
            socket.emit('qrScanned', { 
              playerId: state.currentPlayer.id,
              taskId, 
              answer 
            });
          }
          set({ currentTask: null }); // Clear current task after answering
        },

        // Update lobby players
        setLobbyPlayers: (players: Player[]) => {
          const state = get();
          const currentPlayerId = state.currentPlayer?.id;
          set({ 
            players,
            currentPlayer: currentPlayerId ? players.find(p => p.id === currentPlayerId) || state.currentPlayer : null
          });
        },

        // Start a new game
        startGame: (gameId: string, players: Player[]) => {
          const state = get();
          const currentPlayerId = state.currentPlayer?.id;
          set({ 
            gameId,
            players,
            currentPlayer: currentPlayerId ? players.find(p => p.id === currentPlayerId) || state.currentPlayer : null,
            isInLobby: false,
            isInGame: true
          });
        },

        // Update game state after a move
        updateGameState: (players: Player[], taskResult: TaskResult | null) => {
          const state = get();
          const currentPlayerId = state.currentPlayer?.id;
          set({ 
            players,
            taskResult,
            currentPlayer: currentPlayerId ? players.find(p => p.id === currentPlayerId) || state.currentPlayer : null
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
      };
    },
    {
      name: 'game-storage',
      partialize: (state) => ({
        gameId: state.gameId,
        currentPlayer: state.currentPlayer,
        isInGame: state.isInGame,
        isInLobby: state.isInLobby,
        players: state.players // Also persist players array
      }),
      // Add storage configuration
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const data = JSON.parse(str);
          console.log('Loading state from storage:', data);
          return data;
        },
        setItem: (name, value) => {
          console.log('Saving state to storage:', value);
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => localStorage.removeItem(name)
      }
    }
  )
);