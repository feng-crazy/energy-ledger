// Record Page - 身体扫描和愿景锚点
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import { useApp } from '@/store/AppContext';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors, typography, spacing, borderRadius } from '@/utils/theme';
import { 
  EnergyType, 
  BodyState, 
  DRAIN_STATES, 
  FLOW_STATES, 
  ENERGY_SCORES,
  Vision,
} from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RecordPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const { visions, addRecord } = useApp();
  
  const [step, setStep] = useState(1);
  const [recordType, setRecordType] = useState<EnergyType>((params.type as EnergyType) || 'flow');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [customInput, setCustomInput] = useState('');
  const [selectedVisions, setSelectedVisions] = useState<string[]>([]);
  const [journal, setJournal] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successScore, setSuccessScore] = useState(0);
  
  const states = recordType === 'drain' ? DRAIN_STATES : FLOW_STATES;
  
  const calculateScore = (): number => {
    if (recordType === 'transform') {
      return ENERGY_SCORES.TRANSFORM_BASE * ENERGY_SCORES.TRANSFORM_MULTIPLIER;
    }
    if (recordType === 'drain') {
      return ENERGY_SCORES.DRAIN_BASE + ENERGY_SCORES.DRAIN_AWARENESS_BONUS;
    }
    return ENERGY_SCORES.FLOW_BASE;
  };
  
  const toggleVision = (id: string) => {
    setSelectedVisions(prev => 
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };
  
  const handleSubmit = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const score = calculateScore();
    setSuccessScore(score);
    
    await addRecord({
      type: recordType,
      bodyStateId: selectedState || 'custom',
      customBodyState: selectedState === 'custom' ? customInput : undefined,
      visions: selectedVisions,
      journal,
      score,
      hasAiReport: false,
    });
    
    setShowSuccess(true);
    setTimeout(() => {
      router.back();
    }, 2500);
  };
  
  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };
  
  // Success screen
  if (showSuccess) {
    const isDrain = recordType === 'drain';
    return (
      <View style={[styles.successContainer, { 
        backgroundColor: isDrain ? '#1a0a3e' : '#0a2030'
      }]}>
        <Animated.View entering={FadeIn} style={styles.successContent}>
          <Text style={styles.successEmoji}>
            {isDrain ? '💫' : '💧'}
          </Text>
          
          <View style={[styles.successBadge, {
            backgroundColor: isDrain ? 'rgba(200, 150, 255, 0.15)' : 'rgba(0, 220, 200, 0.15)',
            borderColor: isDrain ? 'rgba(200, 150, 255, 0.4)' : 'rgba(0, 220, 200, 0.4)',
          }]}>
            <Text style={[styles.successScore, { 
              color: isDrain ? 'rgba(200, 150, 255, 0.9)' : 'rgba(0, 220, 200, 0.9)'
            }]}>
              +{successScore} 能量值
            </Text>
          </View>
          
          <Text style={styles.successTitle}>
            {isDrain ? '太棒了！你捕捉到了\n这个能量黑洞。' : '能量正在汇聚。\n保持这份流动。'}
          </Text>
          
          <Text style={styles.successSubtitle}>
            {isDrain ? '看见即是改变。' : '能量在流动 🌊'}
          </Text>
        </Animated.View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={18} color={colors.white.primary} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {step === 1 ? '身体扫描' : step === 2 ? '愿景锚点' : '记录明细'}
        </Text>
        
        <View style={styles.stepIndicators}>
          {[1, 2, 3].map((s) => (
            <View
              key={s}
              style={[
                styles.stepIndicator,
                s <= step && styles.stepIndicatorActive,
                s === step && styles.stepIndicatorCurrent,
              ]}
            />
          ))}
        </View>
      </View>
      
      {/* Type Toggle (Step 1 only) */}
      {step === 1 && (
        <View style={styles.typeToggle}>
          {(['drain', 'flow'] as EnergyType[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.typeButton,
                recordType === t && (t === 'drain' ? styles.typeButtonDrain : styles.typeButtonFlow),
              ]}
              onPress={() => {
                setRecordType(t);
                setSelectedState(null);
              }}
            >
              <Text style={[
                styles.typeButtonText,
                recordType === t && styles.typeButtonTextActive,
              ]}>
                {t === 'drain' ? '🌫️ 耗散态' : '🌊 聚能态'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {step === 1 && (
          <Animated.View entering={FadeIn}>
            <Text style={styles.sectionTitle}>此刻，你的身体/心里感觉像什么？</Text>
            <Text style={styles.sectionSubtitle}>选择最贴近此刻感受的状态</Text>
            
            <View style={styles.statesGrid}>
              {states.map((state) => {
                const isSelected = selectedState === state.id;
                
                if (state.isCustom) {
                  return (
                    <View key={state.id} style={styles.customStateContainer}>
                      <TouchableOpacity
                        style={[
                          styles.customStateHeader,
                          isSelected && { borderColor: 'rgba(150, 150, 200, 0.6)' },
                        ]}
                        onPress={() => setSelectedState(isSelected ? null : state.id)}
                      >
                        <Text style={styles.customStateEmoji}>{state.emoji}</Text>
                        <Text style={styles.customStateLabel}>{state.label}</Text>
                      </TouchableOpacity>
                      {isSelected && (
                        <TextInput
                          style={styles.customInput}
                          value={customInput}
                          onChangeText={setCustomInput}
                          placeholder="描述你此刻的身体感受或心理状态..."
                          placeholderTextColor={colors.white.muted}
                          multiline
                          numberOfLines={3}
                        />
                      )}
                    </View>
                  );
                }
                
                return (
                  <TouchableOpacity
                    key={state.id}
                    style={[
                      styles.stateCard,
                      isSelected && { 
                        backgroundColor: state.color.replace('0.3', '0.5'),
                        borderColor: state.borderColor,
                      },
                    ]}
                    onPress={() => setSelectedState(isSelected ? null : state.id)}
                    activeOpacity={0.9}
                  >
                    <View style={styles.stateCardHeader}>
                      <Text style={styles.stateEmoji}>{state.emoji}</Text>
                      {isSelected && (
                        <View style={styles.stateCheck}>
                          <Check size={12} color="#FFF" />
                        </View>
                      )}
                    </View>
                    <Text style={styles.stateLabel}>{state.label}</Text>
                    {state.desc && <Text style={styles.stateDesc}>{state.desc}</Text>}
                    {isSelected && state.tags.length > 0 && (
                      <View style={styles.stateTags}>
                        {state.tags.map((tag) => (
                          <Text key={tag} style={styles.stateTag}>{tag}</Text>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        )}
        
        {step === 2 && (
          <Animated.View entering={FadeIn}>
            <Text style={styles.sectionTitle}>这份能量流向哪里？</Text>
            <Text style={styles.sectionSubtitle}>选择最相关的愿景（可多选）</Text>
            
            <View style={styles.visionsGrid}>
              {visions.map((vision) => {
                const isSelected = selectedVisions.includes(vision.id);
                return (
                  <TouchableOpacity
                    key={vision.id}
                    style={[
                      styles.visionCard,
                      isSelected && styles.visionCardSelected,
                    ]}
                    onPress={() => toggleVision(vision.id)}
                  >
                    <Text style={styles.visionEmoji}>{vision.emoji}</Text>
                    <Text style={[
                      styles.visionLabel,
                      isSelected && styles.visionLabelSelected,
                    ]}>
                      {vision.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            <TouchableOpacity
              style={[
                styles.noVisionButton,
                selectedVisions.length === 0 && styles.noVisionButtonActive,
              ]}
              onPress={() => setSelectedVisions([])}
            >
              <Text style={styles.noVisionText}>暂无特定指向</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
        
        {step === 3 && (
          <Animated.View entering={FadeIn}>
            <Text style={styles.sectionTitle}>写下此刻的内心活动</Text>
            <Text style={styles.sectionSubtitle}>越详细的记录，越有助于AI洞察</Text>
            
            <Card style={styles.stateSummaryCard}>
              <Text style={styles.stateSummaryLabel}>状态</Text>
              <Text style={styles.stateSummaryValue}>
                {states.find(s => s.id === selectedState)?.label || '自定义'}
              </Text>
            </Card>
            
            <TextInput
              style={styles.journalInput}
              value={journal}
              onChangeText={setJournal}
              placeholder="此刻的想法、感受、身体感知、行为活动..."
              placeholderTextColor={colors.white.muted}
              multiline
              numberOfLines={8}
            />
            
            <Text style={styles.charCount}>{journal.length} / 500</Text>
          </Animated.View>
        )}
      </ScrollView>
      
      {/* Bottom Button */}
      <View style={styles.bottomBar}>
        <Button
          title={step === 3 ? '✨ 提交记录' : '下一步'}
          onPress={handleNext}
          variant={recordType === 'flow' ? 'flow' : 'drain'}
          size="lg"
          disabled={step === 1 && !selectedState}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerTitle: {
    fontSize: 14,
    color: colors.white.secondary,
  },
  stepIndicators: {
    flexDirection: 'row',
    gap: 4,
  },
  stepIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  stepIndicatorActive: {
    backgroundColor: colors.flow.primary,
  },
  stepIndicatorCurrent: {
    width: 20,
  },
  typeToggle: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  typeButtonDrain: {
    backgroundColor: 'rgba(160, 80, 220, 0.3)',
    borderColor: 'rgba(160, 80, 220, 0.6)',
  },
  typeButtonFlow: {
    backgroundColor: 'rgba(0, 160, 160, 0.3)',
    borderColor: 'rgba(0, 200, 200, 0.6)',
  },
  typeButtonText: {
    fontSize: 13,
    color: colors.white.muted,
  },
  typeButtonTextActive: {
    color: colors.white.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white.primary,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.white.muted,
    marginBottom: 20,
  },
  statesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  stateCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    padding: 12,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  stateCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stateEmoji: {
    fontSize: 24,
  },
  stateCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.flow.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white.primary,
    marginTop: 8,
  },
  stateDesc: {
    fontSize: 11,
    color: colors.white.muted,
    marginTop: 3,
  },
  stateTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  stateTag: {
    fontSize: 9,
    color: colors.white.muted,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  customStateContainer: {
    width: '100%',
    padding: 12,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  customStateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customStateEmoji: {
    fontSize: 18,
  },
  customStateLabel: {
    fontSize: 13,
    color: colors.white.muted,
  },
  customInput: {
    marginTop: 12,
    padding: 12,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: colors.white.primary,
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  visionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  visionCard: {
    width: (SCREEN_WIDTH - 68) / 4,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  visionCardSelected: {
    backgroundColor: 'rgba(0, 180, 180, 0.2)',
    borderColor: 'rgba(0, 200, 200, 0.6)',
  },
  visionEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  visionLabel: {
    fontSize: 10,
    color: colors.white.muted,
  },
  visionLabelSelected: {
    color: colors.flow.primary,
  },
  noVisionButton: {
    paddingVertical: 12,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  noVisionButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  noVisionText: {
    fontSize: 13,
    color: colors.white.muted,
  },
  stateSummaryCard: {
    marginBottom: 16,
  },
  stateSummaryLabel: {
    fontSize: 11,
    color: colors.white.muted,
    marginBottom: 6,
  },
  stateSummaryValue: {
    fontSize: 13,
    color: colors.white.secondary,
  },
  journalInput: {
    padding: 16,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    color: colors.white.primary,
    fontSize: 14,
    minHeight: 200,
    textAlignVertical: 'top',
    lineHeight: 24,
  },
  charCount: {
    fontSize: 11,
    color: colors.white.subtle,
    textAlign: 'right',
    marginTop: 8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40,
    backgroundColor: 'rgba(10, 15, 40, 0.95)',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  successEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  successBadge: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    marginBottom: 16,
  },
  successScore: {
    fontSize: 12,
    fontWeight: '600',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white.primary,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 14,
    color: colors.white.muted,
  },
});