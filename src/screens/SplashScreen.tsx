import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, Text, StatusBar, TouchableOpacity } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const videoRef = useRef<Video>(null);
  const [hasFinished, setHasFinished] = useState(false);

  const handlePlaybackUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded && status.didJustFinish && !hasFinished) {
      setHasFinished(true);
      onFinish();
    }
  };

  // Fallback safety timeout (6.5s) to guarantee transition even if video player encounters codec issue
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasFinished) {
        setHasFinished(true);
        onFinish();
      }
    }, 6500);
    return () => clearTimeout(timer);
  }, [hasFinished, onFinish]);

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <Video
        ref={videoRef}
        source={require('../../assets/splash/opn.mp4')}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay={true}
        isLooping={false}
        isMuted={false}
        onPlaybackStatusUpdate={handlePlaybackUpdate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B4332',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});