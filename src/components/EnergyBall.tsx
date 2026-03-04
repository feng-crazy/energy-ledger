// Energy Ball Component with SVG
import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Circle as SvgCircle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { colors } from '@/utils/theme';

const { width } = Dimensions.get('window');
const BALL_SIZE = 130;

interface EnergyBallProps {
  score: number;
  onPress: () => void;
}

export function EnergyBall({ score, onPress }: EnergyBallProps) {
  const isPositive = score >= 0;
  const intensity = Math.min(Math.abs(score) / 100, 1);
  
  // Animation values
  const floatY = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.8);
  const ringScale = useSharedValue(0.8);
  
  useEffect(() => {
    // Float animation
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    
    // Pulse ring animation
    ringOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 0 }),
        withDelay(1000, withTiming(0, { duration: 2000 }))
      ),
      -1,
      false
    );
    
    ringScale.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 0 }),
        withDelay(1000, withTiming(1.6, { duration: 2000 }))
      ),
      -1,
      false
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: isPositive ? floatY.value : 0 },
    ],
  }));
  
  const pulseRingStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));
  
  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };
  
  const primaryColor = isPositive ? colors.flow.primary : colors.drain.primary;
  const secondaryColor = isPositive ? '#00ffea' : '#c060ff';
  
  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
      <View style={styles.container}>
        {/* Pulse rings */}
        <Animated.View style={[styles.pulseRing, pulseRingStyle, { borderColor: primaryColor }]} />
        <Animated.View style={[styles.pulseRing, pulseRingStyle, { borderColor: primaryColor, animationDelay: '1s' }]} />
        
        {/* Glow backdrop */}
        <View style={[styles.glowBackdrop, { backgroundColor: isPositive ? 'rgba(0, 220, 200, 0.2)' : 'rgba(160, 80, 220, 0.2)' }]} />
        
        {/* Main ball */}
        <Animated.View style={[styles.ballContainer, animatedStyle]}>
          <Svg width={BALL_SIZE} height={BALL_SIZE}>
            <Defs>
              <RadialGradient id="ballGradient" cx="30%" cy="30%" r="70%">
                <Stop offset="0%" stopColor={secondaryColor} stopOpacity="1" />
                <Stop offset="100%" stopColor={primaryColor} stopOpacity="1" />
              </RadialGradient>
            </Defs>
            <SvgCircle
              cx={BALL_SIZE / 2}
              cy={BALL_SIZE / 2}
              r={BALL_SIZE / 2 - 2}
              fill="url(#ballGradient)"
            />
          </Svg>
          
          {/* Inner highlight */}
          <View style={styles.innerHighlight} />
          
          {/* Score display */}
          <View style={styles.scoreContainer}>
            <Animated.Text style={[styles.scoreText, { color: '#FFFFFF' }]}>
              {score > 0 ? '+' : ''}{score}
            </Animated.Text>
            <Animated.Text style={styles.scoreLabel}>能量值</Animated.Text>
          </View>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
  },
  glowBackdrop: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  ballContainer: {
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00d4d4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 10,
  },
  innerHighlight: {
    position: 'absolute',
    top: 18,
    left: 22,
    width: 40,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  scoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 28,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
});