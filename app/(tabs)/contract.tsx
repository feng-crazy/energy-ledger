// Contract Page - 能量契约 / 能量加油站
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, X, Plus, Check, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useApp } from '@/store/AppContext';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { colors, typography, spacing, borderRadius } from '@/utils/theme';
import { Commitment } from '@/types';

type Scene = 'active' | 'empty' | 'create';

const quickTimes = ['1小时内', '今天内', '本周内'];
const failTags = ['📱 手机干扰', '😫 太累了', '📅 太忙', '🌧️ 其他'];

export default function ContractPage() {
  const router = useRouter();
  const { visions, activeCommitment, stats, addCommitment, completeCommitment, failCommitment } = useApp();
  
  const [scene, setScene] = useState<Scene>('active');
  const [showFailModal, setShowFailModal] = useState(false);
  const [failReason, setFailReason] = useState('');
  const [failTag, setFailTag] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [countdown, setCountdown] = useState('');
  
  // Create form state
  const [commitment, setCommitment] = useState('');
  const [timeOption, setTimeOption] = useState('今天内');
  const [selectedVision, setSelectedVision] = useState<string | null>(null);
  
  // Update scene based on active commitment
  useEffect(() => {
    if (activeCommitment) {
      setScene('active');
    } else {
      setScene('empty');
    }
  }, [activeCommitment]);
  
  // Countdown timer
  useEffect(() => {
    if (!activeCommitment) return;
    
    const updateCountdown = () => {
      const now = Date.now();
      const remaining = activeCommitment.deadline - now;
      
      if (remaining <= 0) {
        setCountdown('00 : 00 : 00');
        return;
      }
      
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      
      setCountdown(`${hours.toString().padStart(2, '0')} : ${minutes.toString().padStart(2, '0')} : ${seconds.toString().padStart(2, '0')}`);
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [activeCommitment]);
  
  const handleDone = async () => {
    if (!activeCommitment) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await completeCommitment(activeCommitment.id);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setScene('empty');
    }, 2000);
  };
  
  const handleFailSubmit = async () => {
    if (!activeCommitment) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await failCommitment(activeCommitment.id, failReason, failTag || undefined);
    setShowFailModal(false);
    setScene('empty');
  };
  
  const handleCreate = async () => {
    if (!commitment || !selectedVision) return;
    
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const now = Date.now();
    let deadline = now;
    
    switch (timeOption) {
      case '1小时内':
        deadline = now + 60 * 60 * 1000;
        break;
      case '今天内':
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        deadline = endOfDay.getTime();
        break;
      case '本周内':
        const endOfWeek = new Date();
        endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
        endOfWeek.setHours(23, 59, 59, 999);
        deadline = endOfWeek.getTime();
        break;
    }
    
    await addCommitment({
      content: commitment,
      visionId: selectedVision,
      timeOption: timeOption === '1小时内' ? '1hour' : timeOption === '今天内' ? 'today' : 'week',
      deadline,
    });
    
    setCommitment('');
    setSelectedVision(null);
    setScene('active');
  };
  
  const getVisionEmoji = (visionId: string) => {
    const vision = visions.find(v => v.id === visionId);
    return vision?.emoji || '🎯';
  };
  
  const getVisionLabel = (visionId: string) => {
    const vision = visions.find(v => v.id === visionId);
    return vision?.label || '';
  };
  
  // Success screen
  if (showSuccess) {
    return (
      <View style={styles.successContainer}>
        <Animated.View entering={FadeIn} style={styles.successContent}>
          <Text style={styles.successEmoji}>⚡️</Text>
          <Text style={styles.successTitle}>承诺已兑现！</Text>
          <Text style={styles.successSubtitle}>能量 +20 · 连胜 +1</Text>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 你已连续兑现 {stats.completedCommitments + 1} 天！</Text>
          </View>
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
        <Text style={styles.headerTitle}>能量加油站</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      {scene === 'active' && activeCommitment && (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Energy Overview */}
          <Card style={styles.energyCard} variant="flow">
            <View style={styles.energyHeader}>
              <View>
                <Text style={styles.energyLabel}>当前能量值</Text>
                <Text style={styles.energyValue}>⚡️ {stats.totalEnergy}</Text>
              </View>
              <View style={styles.streakDisplay}>
                <Text style={styles.energyLabel}>连续完成</Text>
                <Text style={styles.streakValue}>🔥 {stats.completedCommitments} 天</Text>
              </View>
            </View>
            <View style={styles.energyBar}>
              <View 
                style={[
                  styles.energyBarFill, 
                  { 
                    width: `${stats.totalEnergy > 0 && stats.totalEnergy % 100 === 0 ? 100 : stats.totalEnergy % 100}%`,
                    backgroundColor: colors.flow.primary,
                  }
                ]} 
              />
            </View>
            <Text style={styles.energyNote}>
              阶段 {Math.floor(stats.totalEnergy / 100)} · {stats.totalEnergy > 0 && stats.totalEnergy % 100 === 0 ? 100 : stats.totalEnergy % 100}/100
              {stats.totalEnergy >= 100 && (
                <Text style={styles.energyNoteNext}>
                  · 距下阶段还需 {stats.totalEnergy % 100 === 0 ? 100 : 100 - (stats.totalEnergy % 100)} pts
                </Text>
              )}
            </Text>
          </Card>
          
          {/* Countdown */}
          <View style={styles.countdownCard}>
            <Text style={styles.countdownEmoji}>⏰</Text>
            <View>
              <Text style={styles.countdownLabel}>剩余时间</Text>
              <Text style={styles.countdownValue}>{countdown}</Text>
            </View>
          </View>
          
          {/* Commitment Card */}
          <Card style={styles.commitmentCard}>
            <Text style={styles.commitmentLabel}>📝 我的微承诺</Text>
            <Text style={styles.commitmentText}>"{activeCommitment.content}"</Text>
            <View style={styles.commitmentMeta}>
              <View style={styles.visionTag}>
                <Text style={styles.visionTagEmoji}>{getVisionEmoji(activeCommitment.visionId)}</Text>
                <Text style={styles.visionTagText}>绑定愿景：{getVisionLabel(activeCommitment.visionId)}</Text>
              </View>
            </View>
          </Card>
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              title="做到了"
              onPress={handleDone}
              variant="success"
              size="lg"
              icon={<Check size={18} color="#FFF" />}
              style={styles.doneButton}
            />
            <Button
              title="没做到"
              onPress={() => setShowFailModal(true)}
              variant="secondary"
              size="lg"
              icon={<X size={18} color={colors.white.tertiary} />}
            />
          </View>
        </ScrollView>
      )}
      
      {scene === 'empty' && (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIllustration}>
            <Text style={styles.emptyEmoji}>🌱</Text>
          </View>
          <Text style={styles.emptyTitle}>此刻，是改变的最佳时机</Text>
          <Text style={styles.emptySubtitle}>许下一个微小的承诺，为能量充电</Text>
          
          <Button
            title="创建新承诺"
            onPress={() => setScene('create')}
            variant="flow"
            size="lg"
            icon={<Plus size={18} color="#FFF" />}
            style={styles.createButton}
          />
        </View>
      )}
      
      {scene === 'create' && (
        <ScrollView style={styles.content} contentContainerStyle={styles.createContentContainer}>
          <Text style={styles.createHint}>微小有力量 · 具体可执行</Text>
          
          {/* Step 1 */}
          <Text style={styles.stepTitle}>1 · 我要承诺做什么？</Text>
          <TextInput
            style={styles.commitmentInput}
            value={commitment}
            onChangeText={setCommitment}
            placeholder="今晚10点前不看短视频..."
            placeholderTextColor={colors.white.muted}
            multiline
            numberOfLines={3}
          />
          <View style={styles.tipCard}>
            <Text style={styles.tipEmoji}>💡</Text>
            <Text style={styles.tipText}>试着把"我要减肥"改成"今天不吃夜宵"</Text>
          </View>
          <Text style={styles.charCount}>{commitment.length} / 20</Text>
          
          {/* Step 2 */}
          <Text style={styles.stepTitle}>2 · 什么时候完成？</Text>
          <View style={styles.timeOptions}>
            {quickTimes.map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.timeButton,
                  timeOption === t && styles.timeButtonActive,
                ]}
                onPress={() => setTimeOption(t)}
              >
                <Text style={[
                  styles.timeButtonText,
                  timeOption === t && styles.timeButtonTextActive,
                ]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Step 3 */}
          <Text style={styles.stepTitle}>3 · 这个承诺为了什么愿景？</Text>
          <Text style={styles.requiredHint}>* 必选</Text>
          <View style={styles.visionGrid}>
            {visions.map((vision) => {
              const isSelected = selectedVision === vision.id;
              return (
                <TouchableOpacity
                  key={vision.id}
                  style={[
                    styles.visionButton,
                    isSelected && styles.visionButtonSelected,
                  ]}
                  onPress={() => setSelectedVision(vision.id)}
                >
                  {isSelected && (
                    <View style={styles.visionCheck}>
                      <Check size={10} color="#FFF" />
                    </View>
                  )}
                  <Text style={styles.visionButtonEmoji}>{vision.emoji}</Text>
                  <Text style={[
                    styles.visionButtonLabel,
                    isSelected && styles.visionButtonLabelSelected,
                  ]}>
                    {vision.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
      
      {scene === 'create' && (
        <View style={styles.createBottomBar}>
          <Button
            title="✨ 启动能量"
            onPress={handleCreate}
            variant="flow"
            size="lg"
            disabled={!commitment || !selectedVision}
            icon={<Zap size={18} color="#FFF" />}
          />
        </View>
      )}
      
      {/* Fail Modal */}
      <Modal visible={showFailModal} onClose={() => setShowFailModal(false)}>
        <Text style={styles.modalTitle}>是什么干扰了你？</Text>
        
        <Text style={styles.modalLabel}>💬 请简单描述原因：</Text>
        <TextInput
          style={styles.modalInput}
          value={failReason}
          onChangeText={setFailReason}
          placeholder="例如：突然来了个紧急电话..."
          placeholderTextColor={colors.white.muted}
          multiline
          numberOfLines={3}
        />
        
        <Text style={styles.modalLabel}>快速选择：</Text>
        <View style={styles.failTags}>
          {failTags.map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.failTagButton,
                failTag === t && styles.failTagButtonActive,
              ]}
              onPress={() => setFailTag(failTag === t ? null : t)}
            >
              <Text style={[
                styles.failTagText,
                failTag === t && styles.failTagTextActive,
              ]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.modalTip}>
          <Text style={styles.modalTipEmoji}>💡</Text>
          <Text style={styles.modalTipText}>承认困难也是勇敢的表现。</Text>
        </View>
        
        <Button
          title="记录并重新开始"
          onPress={handleFailSubmit}
          variant="flow"
          size="lg"
        />
      </Modal>
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
    fontSize: 16,
    fontWeight: '600',
    color: colors.white.primary,
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  energyCard: {
    marginBottom: 16,
  },
  energyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  energyLabel: {
    fontSize: 12,
    color: colors.white.muted,
  },
  energyValue: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.flow.primary,
  },
  streakDisplay: {
    alignItems: 'flex-end',
  },
  streakValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.transform.primary,
  },
  energyBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  energyBarFill: {
    height: '100%',
    backgroundColor: colors.flow.primary,
    borderRadius: 3,
  },
  energyNote: {
    fontSize: 11,
    color: colors.white.muted,
    textAlign: 'right',
    marginTop: 4,
  },
  energyNoteNext: {
    fontSize: 11,
    color: colors.transform.primary,
    fontWeight: '600',
  },
  countdownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 180, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 180, 0, 0.2)',
    marginBottom: 16,
  },
  countdownEmoji: {
    fontSize: 18,
  },
  countdownLabel: {
    fontSize: 11,
    color: 'rgba(255, 180, 0, 0.6)',
  },
  countdownValue: {
    fontSize: 20,
    fontWeight: '700',
    color: 'rgba(255, 200, 80, 0.95)',
    fontVariant: ['tabular-nums'],
  },
  commitmentCard: {
    marginBottom: 16,
  },
  commitmentLabel: {
    fontSize: 12,
    color: colors.white.muted,
    marginBottom: 10,
  },
  commitmentText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white.primary,
    lineHeight: 28,
    marginBottom: 12,
  },
  commitmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  visionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0, 180, 180, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 200, 0.2)',
  },
  visionTagEmoji: {
    fontSize: 12,
  },
  visionTagText: {
    fontSize: 11,
    color: 'rgba(0, 200, 200, 0.8)',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  doneButton: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIllustration: {
    marginBottom: 24,
  },
  emptyEmoji: {
    fontSize: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.white.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  createButton: {
    marginTop: 32,
  },
  createContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  createHint: {
    fontSize: 13,
    color: colors.white.muted,
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white.secondary,
    marginBottom: 10,
  },
  commitmentInput: {
    padding: 16,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: colors.white.primary,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    padding: 12,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(0, 180, 180, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 180, 0.15)',
  },
  tipEmoji: {
    fontSize: 12,
  },
  tipText: {
    fontSize: 11,
    color: 'rgba(0, 200, 200, 0.6)',
    flex: 1,
  },
  charCount: {
    fontSize: 11,
    color: colors.white.subtle,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 24,
  },
  timeOptions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  timeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  timeButtonActive: {
    backgroundColor: 'rgba(0, 180, 180, 0.2)',
    borderColor: 'rgba(0, 200, 200, 0.5)',
  },
  timeButtonText: {
    fontSize: 14,
    color: colors.white.muted,
  },
  timeButtonTextActive: {
    color: colors.flow.primary,
    fontWeight: '600',
  },
  requiredHint: {
    fontSize: 11,
    color: 'rgba(255, 0, 0, 0.5)',
    marginBottom: 10,
  },
  visionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  visionButton: {
    width: '23%',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  visionButtonSelected: {
    backgroundColor: 'rgba(0, 180, 180, 0.2)',
    borderColor: 'rgba(0, 200, 200, 0.6)',
  },
  visionCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.flow.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visionButtonEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  visionButtonLabel: {
    fontSize: 9,
    color: colors.white.muted,
  },
  visionButtonLabelSelected: {
    color: colors.flow.primary,
  },
  createBottomBar: {
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
    backgroundColor: colors.background.primary,
  },
  successContent: {
    alignItems: 'center',
  },
  successEmoji: {
    fontSize: 70,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.flow.primary,
  },
  successSubtitle: {
    fontSize: 14,
    color: colors.white.muted,
    marginTop: 8,
  },
  streakBadge: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0, 212, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 212, 0.3)',
  },
  streakText: {
    fontSize: 14,
    color: 'rgba(0, 212, 212, 0.9)',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.white.primary,
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 13,
    color: colors.white.muted,
    marginBottom: 8,
  },
  modalInput: {
    padding: 12,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: colors.white.primary,
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  failTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  failTagButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  failTagButtonActive: {
    backgroundColor: 'rgba(0, 160, 160, 0.2)',
    borderColor: 'rgba(0, 200, 200, 0.4)',
  },
  failTagText: {
    fontSize: 12,
    color: colors.white.muted,
  },
  failTagTextActive: {
    color: colors.flow.primary,
  },
  modalTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(0, 180, 180, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 180, 0.15)',
    marginBottom: 20,
  },
  modalTipEmoji: {
    fontSize: 14,
  },
  modalTipText: {
    fontSize: 11,
    color: 'rgba(0, 200, 200, 0.6)',
  },
});