import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { EnergyBadge } from './EnergyBadge';
import { IconCircleButton } from './IconCircleButton';

interface HeaderBarProps {
  energy?: number;
  onPressEnergy?: () => void;
  onPressStar?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  energy = 10,
  onPressEnergy,
  onPressStar,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <View style={styles.container}>
        <View style={styles.brand}>
          <View style={styles.logoCircle}>
            <Ionicons name="albums" size={24} color="#31C51F" />
            <Ionicons
              name="star"
              size={10}
              color="#FFC928"
              style={styles.logoStar}
            />
          </View>
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
            闪卡记忆
          </Text>
        </View>

        <View style={styles.actions}>
          <EnergyBadge energy={energy} onPress={onPressEnergy} />
          <IconCircleButton
            onPress={onPressStar}
            accessibilityLabel="收藏单词"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#F8FBF6',
  },
  container: {
    height: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
    minWidth: 0,
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E6F8DE',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoStar: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  title: {
    fontSize: 27,
    fontWeight: '700',
    color: '#171A20',
    flexShrink: 1,
    minWidth: 0,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
});
