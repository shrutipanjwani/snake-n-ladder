'use client';

import React, { useState } from 'react';
import styles from './Dice.module.css';

export interface DiceProps {
  onRoll: (value: number) => void;
  disabled?: boolean;
}

const Dice: React.FC<DiceProps> = ({ onRoll, disabled = false }) => {
  const [value, setValue] = useState(1);
  const [isRolling, setIsRolling] = useState(false);

  const handleClick = () => {
    if (disabled || isRolling) return;
    
    setIsRolling(true);
    const newValue = Math.floor(Math.random() * 6) + 1;
    setValue(newValue);
    
    // Simulate rolling animation
    setTimeout(() => {
      setIsRolling(false);
      onRoll(newValue);
    }, 1000);
  };

  const renderDots = () => {
    const dots = [];
    for (let i = 0; i < value; i++) {
      dots.push(<span key={i} className={styles.dot} />);
    }
    return dots;
  };

  return (
    <div className={styles.container}>
      <button
        onClick={handleClick}
        disabled={disabled || isRolling}
        className={styles.button}
        aria-label="Roll dice"
      >
        <div className={`${styles.dice} ${isRolling ? styles.rolling : ''}`}>
          <div className={styles.face}>
            <div className={styles.dots}>
              {renderDots()}
            </div>
          </div>
        </div>
      </button>
    </div>
  );
};

export default Dice; 