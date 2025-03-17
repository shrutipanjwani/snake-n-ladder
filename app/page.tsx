'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LobbyScreen from './components/LobbyScreen';
import { useGameStore } from './store/gameStore';
import { initializeSocket } from './lib/socket';
import { Player } from './lib/types';

export default function Home() {
  const router = useRouter();
  const { 
    isInLobby,
    isInGame,
    players,
    gameId,
    setLobbyPlayers,
    startGame,
  } = useGameStore();

  // Initialize socket and setup listeners
  useEffect(() => {
    // Initialize socket
    const socket = initializeSocket();
    
    // Listen for lobby updates
    socket.on('lobbyUpdate', (waitingPlayers: Player[]) => {
      setLobbyPlayers(waitingPlayers);
    });
    
    // Listen for game start
    socket.on('gameStart', (data: { gameId: string, players: Player[] }) => {
      startGame(data.gameId, data.players);
      router.push('/game');
    });
    
    // Cleanup listeners on unmount
    return () => {
      socket.off('lobbyUpdate');
      socket.off('gameStart');
    };
  }, [setLobbyPlayers, startGame, router]);
  
  // If already in a game, redirect to game page
  useEffect(() => {
    if (isInGame && gameId) {
      router.push('/game');
    }
  }, [isInGame, gameId, router]);
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-100 to-purple-100 py-8 px-4">
      <div className="container mx-auto">
        <LobbyScreen 
          waitingPlayers={players} 
          isJoined={isInLobby}
        />
      </div>
    </main>
  );
}