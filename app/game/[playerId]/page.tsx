'use client';

import React from 'react';
import { useParams } from 'next/navigation';

export default function PlayerGame() {
  const params = useParams();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-100 to-indigo-100">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center">
        <h1 className="text-3xl font-bold text-indigo-600 mb-4">Hello World!</h1>
        <p className="text-gray-600">Player ID: {params.playerId}</p>
      </div>
    </div>
  );
} 