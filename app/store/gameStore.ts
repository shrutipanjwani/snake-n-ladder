// src/store/gameStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getSocket } from '../lib/socket';
import { GameState, Player, Task, TaskResult } from '../lib/types';

interface GameStore extends GameState {
  currentPlayer: Player | null;
  isHydrated: boolean;
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
  isHydrated: false,
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

      socket.on('gameStart', (data: { gameId: string, player: Player, players: Player[], gameUrl: string }) => {
        console.log('Game Start Event Received:', {
          gameId: data.gameId,
          playerId: data.player.id,
          playerName: data.player.name,
          gameUrl: data.gameUrl,
          allPlayers: data.players
        });

        // First update the state with all players
        const state = get();
        const updatedState = { 
          ...state,
          gameId: data.gameId,
          currentPlayer: data.player,
          players: data.players,
          isInLobby: false,
          isInGame: true
        };
        
        // Set state and ensure it's persisted
        set(updatedState);
        
        // Double check state was updated correctly
        const newState = get();
        console.log('State after update:', {
          gameId: newState.gameId,
          currentPlayer: newState.currentPlayer,
          players: newState.players,
          isInGame: newState.isInGame
        });

        // Use Next.js router for navigation to maintain state
        if (typeof window !== 'undefined') {
          const router = require('next/navigation').useRouter();
          router.push(data.gameUrl);
        }
      });

      // Handle game ending
      socket.on('gameEnded', () => {
        const state = get();
        console.log('Game ended by admin, clearing state');
        
        // Clear game state but keep player info
        const clearedState = {
          ...initialState,
          currentPlayer: state.currentPlayer,
          isHydrated: true
        };
        
        set(clearedState);
        
        // Redirect to lobby
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      });

      socket.on('error', (data: { message: string }) => {
        console.error('Game error:', data.message);
      });

      return {
        ...initialState,
        isHydrated: false,
        
        setPlayerName: (name: string) => {
          const socket = getSocket();
          if (!socket.id) return;
          
          const newPlayer = { id: socket.id, name, position: 0, corner: -1 };
          const updatedState = { 
            currentPlayer: newPlayer,
            players: [newPlayer],
            isInLobby: true,
            isHydrated: true
          };
          
          set(updatedState);
          
          // Verify state was updated
          const state = get();
          console.log('State after setPlayerName:', {
            currentPlayer: state.currentPlayer,
            players: state.players,
            isInLobby: state.isInLobby
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
          console.log('Resetting game state');
          localStorage.removeItem('game-storage');
          set({ ...initialState, isHydrated: true });
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
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        const persistedState = {
          gameId: state.gameId,
          currentPlayer: state.currentPlayer,
          players: state.players,
          isInGame: state.isInGame,
          isInLobby: state.isInLobby,
          isHydrated: true
        };
        console.log('Persisting state:', persistedState);
        return persistedState;
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('Rehydrated state:', state);
          state.isHydrated = true;
        }
      }
    }
  )
);