// Energy Ball Component with SVG
import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
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

/**
 * 能量球组件 - 显示当前能量值的核心视觉组件
 * 支持跨平台（iOS/Android/Web）一致的视觉效果
 */
export function EnergyBall({ score, onPress }: EnergyBallProps) {
  const isPositive = score >= 0;

  // 动画值定义
  const floatY = useSharedValue(0);
  const ringOpacity1 = useSharedValue(0.8);
  const ringScale1 = useSharedValue(0.8);
  const ringOpacity2 = useSharedValue(0.8);
  const ringScale2 = useSharedValue(0.8);

  useEffect(() => {
    // 悬浮动画 - 仅在正能量状态下启用
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // 第一个脉冲环动画
    ringOpacity1.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 0 }),
        withDelay(0, withTiming(0, { duration: 2000 }))
      ),
      -1,
      false
    );

    ringScale1.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 0 }),
        withDelay(0, withTiming(1.6, { duration: 2000 }))
      ),
      -1,
      false
    );

    // 第二个脉冲环动画 - 延迟启动
    ringOpacity2.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 0 }),
        withDelay(1000, withTiming(0, { duration: 2000 }))
      ),
      -1,
      false
    );

    ringScale2.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 0 }),
        withDelay(1000, withTiming(1.6, { duration: 2000 }))
      ),
      -1,
      false
    );

    return () => {
      // Cleanup
    };
  }, []);

  // 悬浮动画样式
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: isPositive ? floatY.value : 0 },
    ],
  }));

  // 第一个脉冲环样式
  const pulseRingStyle1 = useAnimatedStyle(() => ({
    opacity: ringOpacity1.value,
    transform: [{ scale: ringScale1.value }],
  }));

  // 第二个脉冲环样式（带延迟）
  const pulseRingStyle2 = useAnimatedStyle(() => ({
    opacity: ringOpacity2.value,
    transform: [{ scale: ringScale2.value }],
  }));

  // 点击事件处理
  const handlePress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.warn('[EnergyBall] Haptics not available:', error);
    }
    onPress();
  };

  const colorScheme = useMemo(() => ({
    primary: isPositive ? colors.flow.primary : colors.drain.primary,
    secondary: isPositive ? '#00ffea' : '#c060ff',
    glowOuter: isPositive ? 'rgba(0, 220, 200, 0.15)' : 'rgba(160, 80, 220, 0.15)',
    glowInner: isPositive ? 'rgba(0, 220, 200, 0.25)' : 'rgba(160, 80, 220, 0.25)',
    shadow: isPositive ? '#00d4d4' : '#a050dc',
  }), [isPositive]);

  // 平台特定的阴影样式
  const platformShadowStyle = useMemo(() => {
    if (Platform.OS === 'ios') {
      return {
        shadowColor: colorScheme.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.6,
        shadowRadius: 24,
      };
    }
    // Android 和 Web 使用 elevation
    return {
      shadowColor: colorScheme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 20,
    };
  }, [colorScheme.shadow]);

  // SVG 渐变 ID 使用 useMemo 确保稳定性
  const gradientIds = useMemo(() => ({
    ball: `ballGradient-${isPositive ? 'flow' : 'drain'}`,
    shadow: `shadowGradient-${isPositive ? 'flow' : 'drain'}`,
  }), [isPositive]);

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
      <View style={styles.container}>
        {/* 脉冲环 - 使用两个独立的动画值实现延迟效果 */}
        <Animated.View style={[styles.pulseRing, pulseRingStyle1, { borderColor: colorScheme.primary }]} />
        <Animated.View style={[styles.pulseRing, pulseRingStyle2, { borderColor: colorScheme.primary }]} />

        {/* 外发光背景 */}
        <View style={[styles.glowBackdrop, styles.glowBackdropOuter, { backgroundColor: colorScheme.glowOuter }]} />
        {/* 内发光背景 */}
        <View style={[styles.glowBackdrop, styles.glowBackdropInner, { backgroundColor: colorScheme.glowInner }]} />

        {/* 主球体容器 */}
        <Animated.View style={[styles.ballContainer, animatedStyle, platformShadowStyle]}>
          <Svg width={BALL_SIZE} height={BALL_SIZE} viewBox={`0 0 ${BALL_SIZE} ${BALL_SIZE}`}>
            <Defs>
              {/* 球体渐变 - 使用数值而非百分比提高兼容性 */}
              <RadialGradient
                id={gradientIds.ball}
                cx={BALL_SIZE * 0.35}
                cy={BALL_SIZE * 0.35}
                rx={BALL_SIZE * 0.65}
                ry={BALL_SIZE * 0.65}
                fx={BALL_SIZE * 0.35}
                fy={BALL_SIZE * 0.35}
              >
                <Stop offset="0" stopColor={colorScheme.secondary} stopOpacity="1" />
                <Stop offset="0.5" stopColor={colorScheme.primary} stopOpacity="0.95" />
                <Stop offset="1" stopColor={colorScheme.primary} stopOpacity="0.85" />
              </RadialGradient>
              {/* 阴影渐变 */}
              <RadialGradient
                id={gradientIds.shadow}
                cx={BALL_SIZE * 0.5}
                cy={BALL_SIZE * 0.5}
                rx={BALL_SIZE * 0.5}
                ry={BALL_SIZE * 0.5}
              >
                <Stop offset="0" stopColor="rgba(0,0,0,0)" stopOpacity="0" />
                <Stop offset="0.8" stopColor="rgba(0,0,0,0.3)" stopOpacity="0.3" />
                <Stop offset="1" stopColor="rgba(0,0,0,0.5)" stopOpacity="0.5" />
              </RadialGradient>
            </Defs>
            {/* 阴影层 */}
            <SvgCircle
              cx={BALL_SIZE / 2}
              cy={BALL_SIZE / 2}
              r={(BALL_SIZE / 2) - 2}
              fill={`url(#${gradientIds.shadow})`}
            />
            {/* 主球体层 */}
            <SvgCircle
              cx={BALL_SIZE / 2}
              cy={BALL_SIZE / 2}
              r={(BALL_SIZE / 2) - 2}
              fill={`url(#${gradientIds.ball})`}
            />
          </Svg>

          {/* 内部高光 */}
          <View style={styles.innerHighlight} />

          {/* 分数显示 */}
          <View style={styles.scoreContainer} pointerEvents="none">
            <Text style={[styles.scoreText, { color: '#FFFFFF' }]}>
              {score > 0 ? '+' : ''}{score}
            </Text>
            <Text style={styles.scoreLabel}>今日能量值</Text>
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
    // 确保容器有明确的定位上下文
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    // 确保脉冲环从中心扩散
    top: 0,
    left: 0,
  },
  glowBackdrop: {
    position: 'absolute',
    borderRadius: 100,
  },
  glowBackdropOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  glowBackdropInner: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  ballContainer: {
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    // 阴影通过 platformShadowStyle 动态设置，这里只保留基础样式
    overflow: 'hidden', // 确保子元素不溢出
  },
  innerHighlight: {
    position: 'absolute',
    top: '20%',
    left: '18%',
    width: '35%',
    height: '22%',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    // 移除阴影避免 Android 渲染问题
    ...Platform.select({
      ios: {
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        // Android 使用 elevation 替代阴影
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 4px rgba(255, 255, 255, 0.3)',
      },
    }),
  },
  scoreContainer: {
    position: 'absolute', // 绝对定位确保文字居中
    alignItems: 'center',
    justifyContent: 'center',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scoreText: {
    fontSize: 28,
    fontWeight: '700',
    // 确保文字有阴影效果增强可读性
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  scoreLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
});