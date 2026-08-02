import React, { useEffect, useState } from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CiciMascotProps {
  size?: number;
}

interface StarConfig {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  size: number;
}

const STAR_POSITIONS: StarConfig[] = [
  { top: 6, right: 8, size: 14 },
  { bottom: 24, left: 2, size: 10 },
  { top: 44, right: 0, size: 12 },
];

export const CiciMascot: React.FC<CiciMascotProps> = ({ size = 160 }) => {
  const [source, setSource] = useState<ImageSourcePropType | null>(null);

  useEffect(() => {
    try {
      const image = require('../../../assets/images/cici-mascot.png');
      setSource(image);
    } catch {
      setSource(null);
    }
  }, []);

  if (!source) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <View style={[styles.placeholder, { width: size, height: size }]}>
          <Ionicons name="happy" size={size * 0.35} color="#31C51F" />
        </View>
        {STAR_POSITIONS.map((star, index) => (
          <Ionicons
            key={index}
            name="star"
            size={star.size}
            color="#FFD84D"
            style={[
              styles.star,
              {
                top: star.top,
                right: star.right,
                bottom: star.bottom,
                left: star.left,
              },
            ]}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={source}
        style={[styles.image, { width: size, height: size }]}
        resizeMode="contain"
      />
      {STAR_POSITIONS.map((star, index) => (
        <Ionicons
          key={index}
          name="star"
          size={star.size}
          color="#FFD84D"
          style={[
            styles.star,
            {
              top: star.top,
              right: star.right,
              bottom: star.bottom,
              left: star.left,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    borderRadius: 999,
    backgroundColor: '#E6F8DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: {
    position: 'absolute',
  },
});
