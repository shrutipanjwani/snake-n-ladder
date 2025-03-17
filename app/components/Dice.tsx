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
    const randomNumber = Math.floor(Math.random() * 6) + 1;
    setCurrentValue(randomNumber);

    // Remove all show classes first
    for (let i = 1; i <= 6; i++) {
      dice.classList.remove(styles[`show${i}`]);
    }

    // Add the show class for the current number
    dice.classList.add(styles[`show${randomNumber}`]);
    
    // Call onRoll after animation
    setTimeout(() => {
      setIsRolling(false);
      onRoll(randomNumber);
    }, 1000);
  };

  return (
    <div className={styles.game}>
      <div className={styles.container}>
        <div id="dice1" className={`${styles.dice} ${styles.diceOne}`}>
          <div id="dice-one-side-one" className={`${styles.side} ${styles.one}`}>
            <div className={`${styles.dot} ${styles.one1}`}></div>
          </div>
          <div id="dice-one-side-two" className={`${styles.side} ${styles.two}`}>
            <div className={`${styles.dot} ${styles.two1}`}></div>
            <div className={`${styles.dot} ${styles.two2}`}></div>
          </div>
          <div id="dice-one-side-three" className={`${styles.side} ${styles.three}`}>
            <div className={`${styles.dot} ${styles.three1}`}></div>
            <div className={`${styles.dot} ${styles.three2}`}></div>
            <div className={`${styles.dot} ${styles.three3}`}></div>
          </div>
          <div id="dice-one-side-four" className={`${styles.side} ${styles.four}`}>
            <div className={`${styles.dot} ${styles.four1}`}></div>
            <div className={`${styles.dot} ${styles.four2}`}></div>
            <div className={`${styles.dot} ${styles.four3}`}></div>
            <div className={`${styles.dot} ${styles.four4}`}></div>
          </div>
          <div id="dice-one-side-five" className={`${styles.side} ${styles.five}`}>
            <div className={`${styles.dot} ${styles.five1}`}></div>
            <div className={`${styles.dot} ${styles.five2}`}></div>
            <div className={`${styles.dot} ${styles.five3}`}></div>
            <div className={`${styles.dot} ${styles.five4}`}></div>
            <div className={`${styles.dot} ${styles.five5}`}></div>
          </div>
          <div id="dice-one-side-six" className={`${styles.side} ${styles.six}`}>
            <div className={`${styles.dot} ${styles.six1}`}></div>
            <div className={`${styles.dot} ${styles.six2}`}></div>
            <div className={`${styles.dot} ${styles.six3}`}></div>
            <div className={`${styles.dot} ${styles.six4}`}></div>
            <div className={`${styles.dot} ${styles.six5}`}></div>
            <div className={`${styles.dot} ${styles.six6}`}></div>
          </div>
        </div>
      </div>
      <div id="roll" className={styles.rollButton}>
        <button 
          onClick={rollDice}
          disabled={isRolling}
        >
          {isRolling ? 'Rolling...' : 'Roll dice!'}
        </button>
      </div>
    </div>
  );
} 