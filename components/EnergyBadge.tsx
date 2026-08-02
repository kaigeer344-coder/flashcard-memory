import React from 'react';
import { Pressable, StyleSheet, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EnergyBadgeProps {
  energy: number;
  onPress?: () => void;
}

export const EnergyBadge: React.FC<EnergyBadgeProps> = ({ energy, onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`能量 ${energy}`}
    >
      <Ionicons name="flash" size={24} color="#FFC928" />
      <Text style={styles.value}>{energy}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 92,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.85,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: '#171A20',
  },
});
