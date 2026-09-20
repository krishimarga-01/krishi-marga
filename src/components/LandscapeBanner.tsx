import React from 'react';
import { StyleSheet, Image, View } from 'react-native';

export const LandscapeBanner = () => {
  return (
    <View style={styles.container} pointerEvents="none">
      <Image
        source={require('../../assets/backgrounds/landscape_hills.png')}
        style={styles.image}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 70,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
