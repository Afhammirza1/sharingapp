import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Share2, Copy, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

const QRCodeGenerator = ({ roomCode, isVisible }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(false);

  // Generate QR code for the room
  useEffect(() => {
    if (roomCode && isVisible) {
      generateQRCode();
    }
  }, [roomCode, isVisible]);

  const generateQRCode = async () => {
    try {
      setLoading(true);
      const roomUrl = `${window.location.origin}?room=${roomCode}`;
      
      const qrDataUrl = await QRCode.toDataURL(roomUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M'
      });
      
      setQrCodeUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const shareRoom = async () => {
    const roomUrl = `${window.location.origin}?room=${roomCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ShareNear - Join my room',
          text: `Join my ShareNear room with code: ${roomCode}`,
          url: roomUrl,
        });
        toast.success('Room shared successfully!');
      } catch (error) {
        if (error.name !== 'AbortError') {
          copyToClipboard(roomUrl);
        }
      }
    } else {
      copyToClipboard(roomUrl);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Room link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  };

  if (!isVisible || !roomCode) return null;

  return (
    <Card className="w-full max-w-sm mx-auto backdrop-blur-md bg-white/90 dark:bg-gray-800/90">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2">
          <Smartphone className="w-5 h-5" />
          <span>Share Room</span>
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Scan QR code or share room code: <strong>{roomCode}</strong>
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Code */}
        <div className="flex justify-center">
          {loading ? (
            <div className="w-64 h-64 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg flex items-center justify-center">
              <span className="text-gray-500">Generating QR...</span>
            </div>
          ) : qrCodeUrl ? (
            <img 
              src={qrCodeUrl} 
              alt="Room QR Code" 
              className="w-64 h-64 rounded-lg border border-gray-200 dark:border-gray-700"
            />
          ) : (
            <div className="w-64 h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">QR Code unavailable</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={shareRoom} variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button 
            onClick={() => copyToClipboard(`${window.location.origin}?room=${roomCode}`)} 
            variant="outline" 
            size="sm"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-500 text-center">
          <p className="mb-1">📱 <strong>Mobile:</strong> Scan QR code to join instantly</p>
          <p>💻 <strong>Desktop:</strong> Share the room code: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{roomCode}</code></p>
        </div>
      </CardContent>
    </Card>
  );
};

export default QRCodeGenerator;