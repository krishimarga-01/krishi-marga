import React from 'react';
import { StyleSheet, Image, View } from 'react-native';

export const TopLeafDecoration = () => {
  return (
    <View style={styles.container} pointerEvents="none">
      <Image
        source={require('../../assets/backgrounds/top_leaf_decoration.png')}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 0,
    width: 130,
    height: 120,
    zIndex: 1,
    opacity: 0.85,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
