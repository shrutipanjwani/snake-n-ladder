// src/store/tasks.ts
export const spiritualTasks = [
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
  },
  {
    id: 'task6',
    question: 'How can we practice mindfulness in daily life?',
    options: [
      'By multitasking constantly',
      'By being aware of our thoughts, actions, and surroundings',
      'By avoiding difficult situations',
      'By criticizing others'
    ],
    correctAnswer: 1,
    moveForward: 6,
    moveBackward: 3
  },
  {
    id: 'task7',
    question: 'What is the importance of gratitude in spiritual life?',
    options: [
      'It has no importance',
      'It makes us appear spiritual to others',
      'It opens our hearts and brings contentment',
      'It helps us get more material things'
    ],
    correctAnswer: 2,
    moveForward: 5,
    moveBackward: 2
  },
  {
    id: 'task8',
    question: 'What is the essence of spiritual teachings across traditions?',
    options: [
      'Rituals and ceremonies',
      'Love, compassion, and service',
      'Building temples and monuments',
      'Debating philosophy'
    ],
    correctAnswer: 1,
    moveForward: 7,
    moveBackward: 4
  },
  {
    id: 'task9',
    question: 'How does forgiveness affect our spiritual journey?',
    options: [
      'It shows weakness',
      'It has no effect',
      'It frees us from negativity and promotes healing',
      'It should only be practiced if others apologize first'
    ],
    correctAnswer: 2,
    moveForward: 6,
    moveBackward: 3
  },
  {
    id: 'task10',
    question: 'What is the spiritual significance of service to others?',
    options: [
      'It earns us social recognition',
      'It has no spiritual significance',
      'It helps us understand our interconnectedness and practice selflessness',
      'It should only be done for financial gain'
    ],
    correctAnswer: 2,
    moveForward: 8,
    moveBackward: 4
  }
];

// Function to find a task by ID
export const getTaskById = (taskId) => {
  return spiritualTasks.find(task => task.id === taskId);
};

// Generate a QR code value for a task
export const generateQRValue = (taskId) => {
  const qrData = { taskId };
  return JSON.stringify(qrData);
};