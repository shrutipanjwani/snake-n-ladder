import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Game state
const waitingPlayers = [];
const activeGames = new Map();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server);

  // Socket.io connection handler
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Player joins lobby
    socket.on('joinLobby', (player) => {
      const newPlayer = {
        id: socket.id,
        name: player.name,
        position: 0,
        corner: -1, // Will be assigned when game starts
      };
      
      waitingPlayers.push(newPlayer);
      
      // Broadcast updated waiting list to all clients
      io.emit('lobbyUpdate', waitingPlayers);
      
      console.log(`${player.name} joined the lobby. Waiting players: ${waitingPlayers.length}`);
      
      // Start game if we have 4 players
      if (waitingPlayers.length === 4) {
        startNewGame();
      }
    });

    // Player scanned QR code
    socket.on('qrScanned', ({ taskId, answer }) => {
      // Find which game this player is in
      let gameId = null;
      let currentGame = null;
      
      for (const [id, game] of activeGames.entries()) {
        if (game.players.some(player => player.id === socket.id)) {
          gameId = id;
          currentGame = game;
          break;
        }
      }
      
      if (!gameId || !currentGame) {
        socket.emit('error', { message: 'You are not in an active game' });
        return;
      }
      
      // Find the player
      const playerIndex = currentGame.players.findIndex(p => p.id === socket.id);
      const player = currentGame.players[playerIndex];
      
      // Find the task
      const task = currentGame.tasks.find(t => t.id === taskId);
      if (!task) {
        socket.emit('error', { message: 'Invalid task ID' });
        return;
      }
      
      // Check answer and update position
      const isCorrect = task.correctAnswer === answer;
      const moveAmount = isCorrect ? task.moveForward : -task.moveBackward;
      
      // Update player position
      const newPosition = Math.max(0, Math.min(50, player.position + moveAmount));
      currentGame.players[playerIndex].position = newPosition;
      
      // Check if player reached the center (position 50)
      const hasWon = newPosition >= 50;
      
      // Update game state
      activeGames.set(gameId, currentGame);
      
      // Broadcast updated game state to all players in this game
      io.to(gameId).emit('gameUpdate', {
        players: currentGame.players,
        taskResult: {
          playerId: player.id,
          isCorrect,
          moveAmount,
          newPosition
        }
      });
      
      // If player won, broadcast game over
      if (hasWon) {
        io.to(gameId).emit('gameOver', {
          winner: player
        });
        
        // Remove game after a delay
        setTimeout(() => {
          activeGames.delete(gameId);
        }, 5000);
      }
    });

    // Player disconnects
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      // Remove from waiting list if in lobby
      const waitingIndex = waitingPlayers.findIndex(p => p.id === socket.id);
      if (waitingIndex !== -1) {
        waitingPlayers.splice(waitingIndex, 1);
        io.emit('lobbyUpdate', waitingPlayers);
      }
      
      // Handle disconnection from active game
      for (const [gameId, game] of activeGames.entries()) {
        const playerIndex = game.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
          // Inform other players
          socket.to(gameId).emit('playerDisconnected', {
            playerId: socket.id,
            playerName: game.players[playerIndex].name
          });
          
          // Remove the player
          game.players.splice(playerIndex, 1);
          
          // If game is empty or has too few players, clean it up
          if (game.players.length < 2) {
            activeGames.delete(gameId);
          } else {
            activeGames.set(gameId, game);
          }
          
          break;
        }
      }
    });
  });

  // Function to start a new game when 4 players are ready
  function startNewGame() {
    if (waitingPlayers.length < 4) return;
    
    // Take the first 4 players from the waiting list
    const gamePlayers = waitingPlayers.splice(0, 4);
    
    // Assign corners (0-3) to each player
    gamePlayers.forEach((player, index) => {
      player.corner = index;
    });
    
    // Create a unique room ID for the game
    const gameId = `game_${Date.now()}`;
    
    // Add players to the game room
    gamePlayers.forEach(player => {
      const socket = io.sockets.sockets.get(player.id);
      if (socket) {
        socket.join(gameId);
      }
    });
    
    // Create game with spiritual tasks
    const newGame = {
      id: gameId,
      players: gamePlayers,
      tasks: generateTasks(), // Function to generate spiritual tasks
      startTime: Date.now()
    };
    
    // Store the game
    activeGames.set(gameId, newGame);
    
    // Notify all players that the game is starting
    io.to(gameId).emit('gameStart', {
      gameId,
      players: gamePlayers
    });
    
    console.log(`Game started with players: ${gamePlayers.map(p => p.name).join(', ')}`);
    
    // Update the lobby for everyone else
    io.emit('lobbyUpdate', waitingPlayers);
  }

  // Function to generate spiritual tasks
  function generateTasks() {
    // This would typically come from a database, but we'll hardcode for simplicity
    return [
      {
        id: 'task1',
        question: 'What is the purpose of meditation?',
        options: [
          'To clear the mind and find inner peace',
          'To become popular',
          'To show off to others',
          'To avoid responsibilities'
        ],
        correctAnswer: 0, // Index of correct option
        moveForward: 5,
        moveBackward: 3
      },
      {
        id: 'task2',
        question: 'What does "Nirankari" focus on?',
        options: [
          'Material wealth',
          'Political power',
          'Universal brotherhood and spiritual awakening',
          'Business success'
        ],
        correctAnswer: 2,
        moveForward: 6,
        moveBackward: 2
      },
      {
        id: 'task3',
        question: 'Which of these is a spiritual practice?',
        options: [
          'Gossiping',
          'Meditation',
          'Criticizing others',
          'Accumulating wealth'
        ],
        correctAnswer: 1,
        moveForward: 4,
        moveBackward: 3
      },
      {
        id: 'task4',
        question: 'What is the foundation of spiritual growth?',
        options: [
          'Self-centeredness',
          'Comparison with others',
          'Self-reflection and humility',
          'Ignoring others'
        ],
        correctAnswer: 2,
        moveForward: 7,
        moveBackward: 4
      },
      {
        id: 'task5',
        question: 'What does spiritual awakening lead to?',
        options: [
          'Separation from others',
          'Inner peace and harmony',
          'Material success',
          'Pride and ego'
        ],
        correctAnswer: 1,
        moveForward: 5,
        moveBackward: 2
      }
      // Add more tasks as needed
    ];
  }

  server.listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});