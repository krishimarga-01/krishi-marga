import React, { useState, useEffect } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [hasFinished, setHasFinished] = useState(false);

  const finishOnce = () => {
    if (!hasFinished) {
      setHasFinished(true);
      onFinish();
    }
  };

  const player = useVideoPlayer(require('../../assets/splash/opn.mp4'), (p) => {
    p.loop = false;
    p.muted = false;
    p.play();
  });

  useEffect(() => {
    const subscription = player.addListener('playToEnd', () => {
      finishOnce();
    });
    return () => {
      subscription.remove();
    };
  }, [player]);

  // Fallback safety timeout (6.5s) to guarantee transition for the 6.0s video
  useEffect(() => {
    const timer = setTimeout(() => {
      finishOnce();
    }, 6500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <VideoView
        player={player}
        style={styles.video}
        contentFit='cover'
        nativeControls={false}
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