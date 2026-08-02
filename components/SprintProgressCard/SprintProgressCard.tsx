import React from 'react';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from './ProgressBar';
import { CiciMascot } from './CiciMascot';

interface SprintProgressCardProps {
  remainingDays: number;
  currentDay: number;
  totalDays: number;
  progress: number;
  label: string;
}

export const SprintProgressCard: React.FC<SprintProgressCardProps> = ({
  remainingDays,
  currentDay,
  totalDays,
  progress,
  label,
}) => {
  const { width } = useWindowDimensions();
  const isSmallScreen = width <= 375;
  const mascotSize = isSmallScreen ? 140 : Math.min(170, Math.round(width * 0.38));

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <View style={styles.leftColumn}>
          <Text style={styles.title} numberOfLines={2}>
            还剩 <Text style={styles.dayNumber}>{remainingDays}</Text> 天，
            <Text style={styles.brandName}>Cici</Text> 陪你一起冲！
          </Text>

          <View style={styles.label}>
            <Ionicons name="flame" size={16} color="#FF5B35" />
            <Text style={styles.labelText}>{label}</Text>
          </View>

          <Text style={styles.dayInfo}>
            Day {currentDay} / {totalDays}
          </Text>

          <ProgressBar progress={progress} />
        </View>

        <View style={styles.rightColumn}>
          <CiciMascot size={mascotSize} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginTop: 18,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 22,
    minHeight: 168,
    maxHeight: 188,
    ...Platform.select({
      ios: {
        shadowColor: '#22B918',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  leftColumn: {
    flex: 0.62,
    justifyContent: 'space-between',
    paddingRight: 10,
  },
  rightColumn: {
    flex: 0.38,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  title: {
    fontSize: 21,
    fontWeight: '700',
    lineHeight: 29,
    color: '#171A20',
  },
  dayNumber: {
    fontWeight: '900',
  },
  brandName: {
    color: '#31C51F',
  },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5EF',
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 12,
    gap: 6,
    marginTop: 10,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#25282D',
  },
  dayInfo: {
    fontSize: 17,
    fontWeight: '600',
    color: '#858995',
    marginTop: 14,
    marginBottom: 8,
  },
});
