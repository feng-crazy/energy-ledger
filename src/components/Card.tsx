// Card Component
import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing } from '@/utils/theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'flow' | 'drain' | 'elevated';
}

export function Card({ children, style, variant = 'default' }: CardProps) {
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'flow':
        return {
          backgroundColor: 'rgba(0, 180, 180, 0.1)',
          borderColor: 'rgba(0, 200, 200, 0.2)',
          borderWidth: 1,
        };
      case 'drain':
        return {
          backgroundColor: 'rgba(160, 80, 220, 0.1)',
          borderColor: 'rgba(160, 80, 220, 0.2)',
          borderWidth: 1,
        };
      case 'elevated':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 4,
        };
      default:
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          borderWidth: 1,
          borderColor: colors.white.border,
        };
    }
  };

  return (
    <View style={[styles.card, getVariantStyles(), style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius['3xl'],
    padding: spacing.lg,
  },
});