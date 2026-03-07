// Onboarding Page - First time user setup
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Button } from '@/components/Button';
import { colors, borderRadius } from '@/utils/theme';

export default function OnboardingPage() {
  const router = useRouter();

  const handleStart = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/vision');
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn} style={styles.content}>
        {/* Welcome */}
        <Text style={styles.welcomeEmoji}>🌟</Text>
        <Text style={styles.welcomeTitle}>欢迎来到功过格</Text>
        <Text style={styles.welcomeSubtitle}>
          这不是另一个自我审判的法庭，而是一面映照内在能量流动的镜子。
        </Text>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>⚡</Text>
            <Text style={styles.featureText}>觉知即功 — 只要记录下来，就是加分项</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>🎯</Text>
            <Text style={styles.featureText}>愿景驱动 — 让能量流向真正重要的地方</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>🧠</Text>
            <Text style={styles.featureText}>AI 洞察 — 从心理学、神经科学角度分析</Text>
          </View>
        </View>

        <Button
          title="开始设定愿景"
          onPress={handleStart}
          variant="flow"
          size="lg"
          style={styles.startButton}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  welcomeEmoji: {
    fontSize: 60,
    textAlign: 'center',
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: colors.white.muted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  features: {
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    padding: 16,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  featureEmoji: {
    fontSize: 20,
  },
  featureText: {
    fontSize: 14,
    color: colors.white.secondary,
    flex: 1,
  },
  startButton: {
    marginTop: 'auto',
    marginBottom: 40,
  },
});
