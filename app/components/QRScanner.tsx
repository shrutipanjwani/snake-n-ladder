'use client';

import React, { useState } from 'react';
import { QrReader } from 'react-qr-reader';

interface QRScannerProps {
  onScan: (taskId: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan }) => {
  const [error, setError] = useState<string | null>(null);

  const handleScan = (result: any) => {
    if (result) {
      try {
        const data = JSON.parse(result.text);
        if (data.taskId) {
          onScan(data.taskId);
        }
      } catch (err) {
        setError('Invalid QR code format');
      }
    }
  };

  const handleError = (err: any) => {
    console.error(err);
    setError('Error accessing camera');
  };

  return (
    <div className="qr-scanner-container">
      <div className="max-w-sm mx-auto">
        <QrReader
          constraints={{ facingMode: 'environment' }}
          onResult={handleScan}
          className="w-full aspect-square"
        />
        {error && (
          <div className="mt-4 text-red-600 text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;