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
let adminSocketId = null; // Track admin socket ID

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server);

  // Socket.io connection handler
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle admin connection
    socket.on('adminConnect', () => {
      console.log('Admin connection request from:', socket.id);
      
      // If no admin exists, make this connection the admin
      if (!adminSocketId) {
        adminSocketId = socket.id;
        socket.isAdmin = true;
        socket.emit('adminConnected', { success: true });
        // Send initial lobby state to admin
        socket.emit('lobbyUpdate', waitingPlayers);
        console.log('New admin authenticated:', socket.id);
      } else {
        // If admin already exists, check if this is the admin
        if (socket.id === adminSocketId) {
          socket.isAdmin = true;
          socket.emit('adminConnected', { success: true });
          socket.emit('lobbyUpdate', waitingPlayers);
          console.log('Existing admin reconnected:', socket.id);
        } else {
          socket.emit('adminConnected', { 
            success: false, 
            message: 'Admin already exists' 
          });
          console.log('Admin connection rejected - admin already exists');
        }
      }
    });

    // Handle lobby state requests
    socket.on('requestLobbyState', () => {
      console.log('Lobby state requested by:', socket.id);
      socket.emit('lobbyUpdate', waitingPlayers);
    });

    // Handle admin starting the game
    socket.on('adminStartGame', () => {
      if (!socket.isAdmin) {
        console.log('Unauthorized attempt to start game');
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      console.log('Admin start game request received');
      if (waitingPlayers.length > 0) {
        console.log('Starting new game via admin request');
        startNewGame();
      } else {
        console.log('Admin start game request rejected - no players waiting');
        socket.emit('error', { 
          message: 'Cannot start game - no players waiting' 
        });
      }
    });

    // Handle admin ending the game
    socket.on('adminEndGame', () => {
      if (!socket.isAdmin) {
        console.log('Unauthorized attempt to end game');
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      console.log('Admin end game request received');
      // Find any active game
      for (const [gameId, game] of activeGames.entries()) {
        // Notify all players that game has ended
        game.players.forEach(player => {
          const playerSocket = io.sockets.sockets.get(player.id);
          if (playerSocket) {
            console.log('Sending gameEnded event to player:', player.id);
            playerSocket.emit('gameEnded', { message: 'Game ended by admin' });
          }
        });
        
        // Clear the game
        activeGames.delete(gameId);
        console.log('Game ended by admin:', gameId);
      }

      // Notify admin that game has ended
      console.log('Sending gameEnded event to admin');
      socket.emit('gameEnded');
      
      // Broadcast game ended event to all clients
      console.log('Broadcasting gameEnded event to all clients');
      io.emit('gameEnded');
    });

    // Handle player rejoining game
    socket.on('rejoinGame', ({ gameId, player }) => {
      const game = activeGames.get(gameId);
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      // Update player's socket ID in the game
      const playerIndex = game.players.findIndex(p => p.name === player.name);
      if (playerIndex !== -1) {
        game.players[playerIndex].id = socket.id;
        socket.join(gameId);
        
        // Send current game state back to player
        socket.emit('gameStart', {
          gameId,
          player: game.players[playerIndex],
          gameUrl: `/game/${socket.id}`
        });
      }
    });

    // Player joins lobby
    socket.on('joinLobby', (player) => {
      const newPlayer = {
        id: player.testId || socket.id,
        name: player.name,
        position: 0,
        corner: -1
      };
      
      // Check if player with same ID already exists
      const existingPlayerIndex = waitingPlayers.findIndex(p => p.id === newPlayer.id);
      if (existingPlayerIndex !== -1) {
        socket.emit('error', { message: 'Player already exists' });
        return;
      }
      
      waitingPlayers.push(newPlayer);
      
      // Broadcast updated waiting list to all clients
      io.emit('lobbyUpdate', waitingPlayers);
      
      console.log(`${player.name} joined the lobby. Waiting players: ${waitingPlayers.length}`);
    });

    // Player scanned QR code
    socket.on('qrScanned', ({ playerId, taskId, answer }) => {
      let gameId = null;
      let currentGame = null;
      
      // Find the game this player is in
      for (const [id, game] of activeGames.entries()) {
        if (game.players.some(p => p.id === playerId)) {
          gameId = id;
          currentGame = game;
          break;
        }
      }
      
      if (!gameId || !currentGame) return;
      
      const playerIndex = currentGame.players.findIndex(p => p.id === playerId);
      if (playerIndex === -1) return;
      
      const player = currentGame.players[playerIndex];
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
      
      // Check for win condition
      if (newPosition >= 50) {
        currentGame.players[playerIndex].hasWon = true;
        socket.emit('playerWon', { playerId });
      }
      
      // Update game state
      activeGames.set(gameId, currentGame);
      
      // Notify player of task completion and new position
      socket.emit('taskCompleted', {
        playerId,
        success: isCorrect
      });
      
      socket.emit('gameUpdate', {
        player: currentGame.players[playerIndex],
        position: newPosition
      });
    });

    // Player disconnects
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      // If admin disconnects, clear admin status
      if (socket.id === adminSocketId) {
        adminSocketId = null;
        console.log('Admin disconnected, admin status cleared');
      }
      
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

    // Handle dice roll
    socket.on('rollDice', ({ playerId, roll }) => {
      let gameId = null;
      let currentGame = null;
      
      // Find the game this player is in
      for (const [id, game] of activeGames.entries()) {
        if (game.players.some(p => p.id === playerId)) {
          gameId = id;
          currentGame = game;
          break;
        }
      }
      
      if (!gameId || !currentGame) return;
      
      const playerIndex = currentGame.players.findIndex(p => p.id === playerId);
      if (playerIndex === -1) return;
      
      const player = currentGame.players[playerIndex];
      if (player.hasWon) return; // Don't allow moves if player has won
      
      // Calculate new position
      const newPosition = Math.min(50, player.position + roll);
      currentGame.players[playerIndex].position = newPosition;
      
      // Check if landed on QR code position
      const qrTaskId = hasQRCode(newPosition);
      if (qrTaskId) {
        socket.emit('requireQRScan', {
          playerId,
          position: newPosition,
          taskId: qrTaskId
        });
      }
      
      // Check for win condition
      if (newPosition >= 50) {
        currentGame.players[playerIndex].hasWon = true;
        socket.emit('playerWon', { playerId });
      }
      
      // Update game state
      activeGames.set(gameId, currentGame);
      
      // Send update only to the player who rolled
      socket.emit('gameUpdate', {
        player: currentGame.players[playerIndex],
        position: newPosition
      });
    });

    // Handle player connection
    socket.on('playerConnect', (playerName) => {
      console.log('Player connected:', playerName);
      
      // Add to waiting players
      const player = {
        id: socket.id,
        name: playerName,
        position: 1,
        diceValue: 0,
        isActive: true
      };
      waitingPlayers.push(player);
      console.log('Added player to waiting list:', player);
      io.emit('lobbyUpdate', waitingPlayers);
    });
  });

  // Function to start a new game when admin initiates
  function startNewGame() {
    if (waitingPlayers.length < 1) return;
    
    // Take all players from the waiting list
    const gamePlayers = [...waitingPlayers];
    waitingPlayers.length = 0; // Clear the waiting list
    
    // Create a unique room ID for the game
    const gameId = `game_${Date.now()}`;
    
    // Create new game state
    const newGame = {
      id: gameId,
      players: gamePlayers.map(player => ({
        ...player,
        position: 0,
        hasWon: false,
        isActive: true
      })),
      tasks: generateTasks(),
      startTime: Date.now()
    };
    
    // Store game state
    activeGames.set(gameId, newGame);

    // Notify all players about game start and redirect them
    gamePlayers.forEach(player => {
      const socket = io.sockets.sockets.get(player.id);
      if (socket) {
        console.log('Starting game for player:', {
          playerId: player.id,
          playerName: player.name,
          gameUrl: `/game/${player.id}`
        });
        
        // Join the game room
        socket.join(gameId);
        
        // Send game start event with player data
        socket.emit('gameStart', {
          gameId,
          player: {
            ...player,
            position: 0,
            hasWon: false,
            isActive: true
          },
          players: newGame.players,
          gameUrl: `/game/${player.id}`
        });
      }
    });
    
    // Notify admin that game has started
    const adminSocket = io.sockets.sockets.get(adminSocketId);
    if (adminSocket) {
      console.log('Sending gameStarted event to admin:', adminSocketId);
      adminSocket.emit('gameStarted', {
        gameId,
        players: gamePlayers
      });
    } else {
      console.log('No admin socket found to send gameStarted event');
    }
    
    // Broadcast game started event to all clients
    console.log('Broadcasting gameStarted event to all clients');
    io.emit('gameStarted', {
      gameId,
      players: gamePlayers
    });
    
    console.log(`Game started with ${gamePlayers.length} players`);
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
    ];
  }

  server.listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});