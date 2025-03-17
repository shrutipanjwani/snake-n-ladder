'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { getTaskById } from '../store/tasks';
import { useGameStore } from '../store/gameStore';

const QRScanner: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const setCurrentTask = useGameStore(state => state.setCurrentTask);

  // Initialize scanner
  useEffect(() => {
    if (typeof window !== 'undefined') {
      scannerRef.current = new Html5Qrcode('qr-reader');
    }

    // Cleanup scanner on component unmount
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop()
          .catch(err => console.error('Error stopping scanner:', err));
      }
    };
  }, []);

  // Start scanning
  const startScanner = () => {
    setScanError(null);
    setIsScanning(true);

    const config = { fps: 10, qrbox: 250 };
    
    if (scannerRef.current) {
      scannerRef.current.start(
        { facingMode: 'environment' }, // Use back camera
        config,
        onScanSuccess,
        onScanFailure
      ).catch(err => {
        console.error('Error starting scanner:', err);
        setScanError('Failed to start camera. Please check permissions.');
        setIsScanning(false);
      });
    }
  };

  // Stop scanning
  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop()
        .then(() => {
          setIsScanning(false);
        })
        .catch(err => {
          console.error('Error stopping scanner:', err);
        });
    } else {
      setIsScanning(false);
    }
  };

  // Handle successful scan
  const onScanSuccess = (decodedText: string) => {
    try {
      // Stop scanner first
      stopScanner();

      // Parse QR code data
      const qrData = JSON.parse(decodedText);
      
      // Find the task by ID
      const task = getTaskById(qrData.taskId);
      
      if (task) {
        // Set the current task in the game store
        setCurrentTask(task);
      } else {
        setScanError('Invalid QR code: Task not found');
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      setScanError('Invalid QR code format');
    }
  };

  // Handle scan failure
  const onScanFailure = (error: string) => {
    // Don't show errors during normal scanning operation
    console.log('QR scan failure:', error);
  };

  return (
    <div className="mb-4">
      <div id="qr-reader" className="w-full max-w-sm mx-auto rounded overflow-hidden shadow-lg"></div>
      
      {scanError && (
        <div className="mt-2 text-red-600 text-center">{scanError}</div>
      )}
      
      <div className="mt-4 flex justify-center">
        {!isScanning ? (
          <button
            onClick={startScanner}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Scan QR Code
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Stop Scanning
          </button>
        )}
      </div>
    </div>
  );
};

export default QRScanner;