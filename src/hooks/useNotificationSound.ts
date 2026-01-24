import { useCallback, useRef } from 'react';

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playNotificationSound = useCallback(() => {
    try {
      // Create audio element if it doesn't exist
      if (!audioRef.current) {
        audioRef.current = new Audio('/notification.mp3');
        audioRef.current.volume = 0.3; // 30% volume for subtle notification
      }

      // Reset to beginning if already playing
      audioRef.current.currentTime = 0;
      
      // Play the sound
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Autoplay was prevented (browser policy) - this is expected on first load
          console.log('Notification sound blocked by browser:', error.message);
        });
      }
    } catch (error) {
      console.log('Error playing notification sound:', error);
    }
  }, []);

  return { playNotificationSound };
}
