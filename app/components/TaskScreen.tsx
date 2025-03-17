'use client';

import React, { useState } from 'react';
import { Task } from '../lib/types';
import { useGameStore } from '../store/gameStore';

interface TaskScreenProps {
  task: Task;
}

const TaskScreen: React.FC<TaskScreenProps> = ({ task }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const answerTask = useGameStore(state => state.answerTask);

  const handleOptionSelect = (index: number) => {
    setSelectedOption(index);
  };

  const handleSubmit = () => {
    if (selectedOption !== null) {
      answerTask(task.id, selectedOption);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4 text-center text-indigo-600">Spiritual Question</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">{task.question}</h3>
        
        <div className="space-y-3">
          {task.options.map((option, index) => (
            <div
              key={index}
              className={`p-3 border rounded-md cursor-pointer transition-colors ${
                selectedOption === index 
                  ? 'bg-indigo-100 border-indigo-500' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleOptionSelect(index)}
            >
              <div className="flex items-center">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                  selectedOption === index ? 'border-indigo-500 bg-indigo-500' : 'border-gray-400'
                }`}>
                  {selectedOption === index && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
                <span>{option}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-center">
        <button
          onClick={handleSubmit}
          disabled={selectedOption === null}
          className={`px-6 py-2 rounded-md font-medium ${
            selectedOption === null
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          Submit Answer
        </button>
      </div>
    </div>
  );
};

export default TaskScreen;