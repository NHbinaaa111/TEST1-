import useSound from 'use-sound';
import { useCallback } from 'react';

export function useSoundEffects() {
  const [playStartSound] = useSound('/sounds/start-session.mp3', { volume: 0.5 });
  const [playEndSound] = useSound('/sounds/end-session.mp3', { volume: 0.5 });
  
  const playSessionStartSound = useCallback(() => {
    try {
      playStartSound();
    } catch (error) {
      console.error('Failed to play start sound:', error);
    }
  }, [playStartSound]);
  
  const playSessionEndSound = useCallback(() => {
    try {
      playEndSound();
    } catch (error) {
      console.error('Failed to play end sound:', error);
    }
  }, [playEndSound]);
  
  return {
    playSessionStartSound,
    playSessionEndSound
  };
}