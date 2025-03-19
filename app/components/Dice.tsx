'use client';

import React, { useState, useEffect } from 'react';
import styles from './Dice.module.css';

export interface DiceProps {
  onRoll: (value: number) => void;
  disabled?: boolean;
  displayValue?: number;
}

const Dice: React.FC<DiceProps> = ({ onRoll, disabled = false, displayValue }) => {
  const [value, setValue] = useState(displayValue || 1);
  const [isRolling, setIsRolling] = useState(false);

  // Update local value when displayValue changes
  useEffect(() => {
    if (displayValue !== undefined && !isRolling) {
      setValue(displayValue);
    }
  }, [displayValue, isRolling]);

  const handleClick = () => {
    if (disabled || isRolling) return;
    
    setIsRolling(true);
    
    // Simulate rolling animation with multiple values
    let rollCount = 0;
    const maxRolls = 10;
    const rollInterval = setInterval(() => {
      const randomValue = Math.floor(Math.random() * 6) + 1;
      setValue(randomValue);
      rollCount++;
      
      if (rollCount >= maxRolls) {
        clearInterval(rollInterval);
        setIsRolling(false);
        onRoll(randomValue);
      }
    }, 100);
  };

  const renderDots = () => {
    // Use the current value for rendering
    const currentValue = value;
    
    switch (currentValue) {
      case 1:
        return [<span key="center" className={`${styles.dot} ${styles.center}`} />];
      case 2:
        return [
          <span key="top-right" className={`${styles.dot} ${styles.topRight}`} />,
          <span key="bottom-left" className={`${styles.dot} ${styles.bottomLeft}`} />
        ];
      case 3:
        return [
          <span key="top-right" className={`${styles.dot} ${styles.topRight}`} />,
          <span key="center" className={`${styles.dot} ${styles.center}`} />,
          <span key="bottom-left" className={`${styles.dot} ${styles.bottomLeft}`} />
        ];
      case 4:
        return [
          <span key="top-left" className={`${styles.dot} ${styles.topLeft}`} />,
          <span key="top-right" className={`${styles.dot} ${styles.topRight}`} />,
          <span key="bottom-left" className={`${styles.dot} ${styles.bottomLeft}`} />,
          <span key="bottom-right" className={`${styles.dot} ${styles.bottomRight}`} />
        ];
      case 5:
        return [
          <span key="top-left" className={`${styles.dot} ${styles.topLeft}`} />,
          <span key="top-right" className={`${styles.dot} ${styles.topRight}`} />,
          <span key="center" className={`${styles.dot} ${styles.center}`} />,
          <span key="bottom-left" className={`${styles.dot} ${styles.bottomLeft}`} />,
          <span key="bottom-right" className={`${styles.dot} ${styles.bottomRight}`} />
        ];
      case 6:
        return [
          <span key="top-left" className={`${styles.dot} ${styles.topLeft}`} />,
          <span key="top-right" className={`${styles.dot} ${styles.topRight}`} />,
          <span key="middle-left" className={`${styles.dot} ${styles.middleLeft}`} />,
          <span key="middle-right" className={`${styles.dot} ${styles.middleRight}`} />,
          <span key="bottom-left" className={`${styles.dot} ${styles.bottomLeft}`} />,
          <span key="bottom-right" className={`${styles.dot} ${styles.bottomRight}`} />
        ];
      default:
        return [];
    }
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