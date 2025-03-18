// src/store/gameStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, Player, Task, TaskResult } from '../lib/types';

interface GameStore extends GameState {
  // Player actions
  setPlayerName: (name: string) => void;
  joinGame: () => void;
  resetGame: () => void;
  answerTask: (taskId: string, answer: number) => void;
  setLobbyPlayers: (players: Player[]) => void;
  startGame: (gameId: string, players: Player[]) => void;
  setCurrentTask: (task: Task | null) => void;
  updatePlayerPosition: (playerId: string, newPosition: number) => void;
}

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
  isGameStarted: false
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setPlayerName: (name: string) => {
        set({ currentPlayer: { id: '', name, position: 0, corner: -1 } });
      },

      joinGame: () => {
        set({ isInLobby: true });
      },

      resetGame: () => {
        set(initialState);
      },

      answerTask: (taskId: string, answer: number) => {
        const { currentTask } = get();
        if (!currentTask) return;

        const isCorrect = currentTask.correctAnswer === answer;
        set({
          taskResult: {
            playerId: get().currentPlayer?.id || '',
            isCorrect,
            moveAmount: isCorrect ? currentTask.moveForward : -currentTask.moveBackward,
            newPosition: (get().currentPlayer?.position || 0) + (isCorrect ? currentTask.moveForward : -currentTask.moveBackward)
          }
        });
      },

      setLobbyPlayers: (players: Player[]) => {
        set({ players });
      },

      startGame: (gameId: string, players: Player[]) => {
        console.log('Starting game in store:', { gameId, players });
        set({ 
          gameId, 
          players, 
          isInGame: true, 
          isInLobby: false,
          isGameStarted: true
        });
      },

      updatePlayerPosition: (playerId: string, newPosition: number) => {
        set((state) => ({
          players: state.players.map(player =>
            player.id === playerId
              ? { ...player, position: newPosition }
              : player
          )
        }));
      },

      setCurrentTask: (task: Task | null) => {
        set({ currentTask: task });
      }
    }),
    {
      name: 'game-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isHydrated = true;
        }
      }
    }
  )
);