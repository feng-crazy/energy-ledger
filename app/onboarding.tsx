// Onboarding Page - First time user setup
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Check, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { useApp } from '@/store/AppContext';
import { Button } from '@/components/Button';
import { colors, typography, spacing, borderRadius } from '@/utils/theme';
import { PRESET_VISIONS } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function OnboardingPage() {
  const router = useRouter();
  const { addVision, completeOnboarding } = useApp();
  const [step, setStep] = useState(1);
  const [selectedVisions, setSelectedVisions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const toggleVision = (id: string) => {
    setSelectedVisions(prev => 
      prev.includes(id) 
        ? prev.filter(v => v !== id)
        : prev.length < 3 
          ? [...prev, id]
          : prev
    );
  };
  
  const handleContinue = async () => {
    if (step === 1) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(2);
    } else {
      setLoading(true);
      
      // Add selected visions
      for (const visionId of selectedVisions) {
        const preset = PRESET_VISIONS.find(p => p.id === visionId);
        if (preset) {
          await addVision({
            title: preset.title,
            emoji: preset.emoji,
            label: preset.label,
            desc: preset.desc,
          });
        }
      }
      
      await completeOnboarding();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      router.replace('/');
    }
  };
  
  return (
    <View style={styles.container}>
      {step === 1 && (
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
              <Text style={styles.featureText}>AI 洞察 — 从哲学、神经科学角度分析</Text>
            </View>
          </View>
          
          <Button
            title="开始设定愿景"
            onPress={handleContinue}
            variant="flow"
            size="lg"
            style={styles.startButton}
          />
        </Animated.View>
      )}
      
      {step === 2 && (
        <Animated.View entering={SlideInRight} style={styles.content}>
          <Text style={styles.stepTitle}>选择你的核心愿景</Text>
          <Text style={styles.stepSubtitle}>
            选择 1-3 个你最重视的领域，这些将作为你能量记录的锚点
          </Text>
          
          <ScrollView style={styles.visionList} contentContainerStyle={styles.visionListContent}>
            <View style={styles.visionGrid}>
              {PRESET_VISIONS.map((vision) => {
                const isSelected = selectedVisions.includes(vision.id);
                return (
                  <TouchableOpacity
                    key={vision.id}
                    style={[
                      styles.visionCard,
                      isSelected && styles.visionCardSelected,
                    ]}
                    onPress={() => toggleVision(vision.id)}
                    activeOpacity={0.8}
                  >
                    {isSelected && (
                      <View style={styles.visionCheck}>
                        <Check size={12} color="#FFF" />
                      </View>
                    )}
                    <Text style={styles.visionEmoji}>{vision.emoji}</Text>
                    <Text style={[
                      styles.visionLabel,
                      isSelected && styles.visionLabelSelected,
                    ]}>
                      {vision.label}
                    </Text>
                    <Text style={styles.visionDesc}>{vision.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
          
          <View style={styles.bottomBar}>
            <Text style={styles.selectedCount}>
              已选择 {selectedVisions.length} / 3 个愿景
            </Text>
            <Button
              title="完成设定"
              onPress={handleContinue}
              variant="flow"
              size="lg"
              disabled={selectedVisions.length === 0}
              loading={loading}
            />
          </View>
        </Animated.View>
      )}
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
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: colors.white.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  visionList: {
    flex: 1,
  },
  visionListContent: {
    paddingBottom: 160,
  },
  visionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  visionCard: {
    width: (SCREEN_WIDTH - 72) / 2,
    padding: 16,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
  },
  visionCardSelected: {
    backgroundColor: 'rgba(0, 180, 180, 0.15)',
    borderColor: 'rgba(0, 200, 200, 0.4)',
  },
  visionCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.flow.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  visionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white.primary,
    marginBottom: 4,
  },
  visionLabelSelected: {
    color: colors.flow.primary,
  },
  visionDesc: {
    fontSize: 12,
    color: colors.white.muted,
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 40,
    backgroundColor: 'rgba(10, 15, 40, 0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  selectedCount: {
    fontSize: 13,
    color: colors.white.muted,
    textAlign: 'center',
    marginBottom: 16,
  },
});