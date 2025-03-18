'use client';

import { useState } from 'react';
import styles from './Dice.module.css';

interface DiceProps {
  onRoll: (value: number) => void;
}

export default function Dice({ onRoll }: DiceProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [currentValue, setCurrentValue] = useState<number | null>(null);

  const rollDice = () => {
    setIsRolling(true);
    const dice = document.getElementById('dice1');
    if (!dice) return;

    // Generate random number between 1 and 6
    const diceValue = Math.floor(Math.random() * 6) + 1;
    
    // Update the current value immediately
    setCurrentValue(diceValue);

    // Remove all show classes first
    for (let i = 1; i <= 6; i++) {
      dice.classList.remove(styles[`show-${i}`]);
    }

    // Add the new show class
    dice.classList.add(styles[`show-${diceValue}`]);
    
    // Send the value to backend
    onRoll(diceValue);

    // Reset rolling state after animation
    setTimeout(() => {
      setIsRolling(false);
    }, 1000);
  };

  return (
    <div className={styles.game}>
      <div className={styles.container}>
        <div id="dice1" className={`${styles.dice} ${styles['dice-one']}`}>
          <div id="dice-one-side-one" className={`${styles.side} ${styles.one}`}>
            <div className={`${styles.dot} ${styles['one-1']}`}></div>
          </div>
          <div id="dice-one-side-two" className={`${styles.side} ${styles.two}`}>
            <div className={`${styles.dot} ${styles['two-1']}`}></div>
            <div className={`${styles.dot} ${styles['two-2']}`}></div>
          </div>
          <div id="dice-one-side-three" className={`${styles.side} ${styles.three}`}>
            <div className={`${styles.dot} ${styles['three-1']}`}></div>
            <div className={`${styles.dot} ${styles['three-2']}`}></div>
            <div className={`${styles.dot} ${styles['three-3']}`}></div>
          </div>
          <div id="dice-one-side-four" className={`${styles.side} ${styles.four}`}>
            <div className={`${styles.dot} ${styles['four-1']}`}></div>
            <div className={`${styles.dot} ${styles['four-2']}`}></div>
            <div className={`${styles.dot} ${styles['four-3']}`}></div>
            <div className={`${styles.dot} ${styles['four-4']}`}></div>
          </div>
          <div id="dice-one-side-five" className={`${styles.side} ${styles.five}`}>
            <div className={`${styles.dot} ${styles['five-1']}`}></div>
            <div className={`${styles.dot} ${styles['five-2']}`}></div>
            <div className={`${styles.dot} ${styles['five-3']}`}></div>
            <div className={`${styles.dot} ${styles['five-4']}`}></div>
            <div className={`${styles.dot} ${styles['five-5']}`}></div>
          </div>
          <div id="dice-one-side-six" className={`${styles.side} ${styles.six}`}>
            <div className={`${styles.dot} ${styles['six-1']}`}></div>
            <div className={`${styles.dot} ${styles['six-2']}`}></div>
            <div className={`${styles.dot} ${styles['six-3']}`}></div>
            <div className={`${styles.dot} ${styles['six-4']}`}></div>
            <div className={`${styles.dot} ${styles['six-5']}`}></div>
            <div className={`${styles.dot} ${styles['six-6']}`}></div>
          </div>
        </div>
      </div>
      <div id="roll" className={styles['roll-button']}>
        <button onClick={rollDice} disabled={isRolling}>
          {isRolling ? 'Rolling...' : 'Roll dice!'}
        </button>
      </div>
      {/* Display the current dice value */}
      <p>Current Dice Value: {currentValue}</p>
    </div>
  );
} 