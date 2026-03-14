// Contract Page - 能量契约 / 能量加油站
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import WheelPicker from '@quidone/react-native-wheel-picker';
import { useRouter } from 'expo-router';
import { ArrowLeft, X, Plus, Check, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useApp } from '@/store/AppContext';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { colors, spacing, borderRadius } from '@/utils/theme';
import { Commitment, ENERGY_SCORES } from '@/types';
import { getVisionLabel, getVisionEmoji } from '@/utils/recordHelpers';

type Scene = 'active' | 'empty' | 'create';

const quickTimes = ['1小时内', '今天内', '本周内'];
const failTags = ['📱 手机干扰', '😫 太累了', '📅 太忙', '🌧️ 其他'];

// Generate number arrays for picker
const generateNumbers = (start: number, end: number) => {
  return Array.from({ length: end - start + 1 }, (_, i) => ({
    value: start + i,
    label: (start + i).toString().padStart(2, '0'),
  }));
};

const DAYS = generateNumbers(0, 6);
const HOURS = generateNumbers(0, 23);
const MINUTES = generateNumbers(0, 59);

export default function ContractPage() {
  const router = useRouter();
  const { visions, activeCommitments, stats, addCommitment, completeCommitment, failCommitment, deleteCommitment, checkDailyCommitments } = useApp();

  const [scene, setScene] = useState<Scene>('active');
  const [showFailModal, setShowFailModal] = useState(false);
  const [failReason, setFailReason] = useState('');
  const [failTag, setFailTag] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [commitmentEnergy, setCommitmentEnergy] = useState(0);
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});

  // Create form state
  const [commitment, setCommitment] = useState('');
  const [selectedDays, setSelectedDays] = useState(0);
  const [selectedHours, setSelectedHours] = useState(1);
  const [selectedMinutes, setSelectedMinutes] = useState(0);
  const [selectedVision, setSelectedVision] = useState<string | null>(null);
  const [timeType, setTimeType] = useState<'once' | 'daily'>('once');

  // Update scene based on active commitments
  useEffect(() => {
    if (activeCommitments.length > 0) {
      setScene('active');
    } else {
      setScene('empty');
    }
  }, [activeCommitments]);

  // Check daily commitments count on mount
  useEffect(() => {
    checkDailyCommitments();
  }, [checkDailyCommitments]);

  // Countdown timers for each commitment
  useEffect(() => {
    if (activeCommitments.length === 0) return;

    const updateCountdowns = () => {
      const now = Date.now();
      const newCountdowns: Record<string, string> = {};

      activeCommitments.forEach((c: Commitment) => {
        const remaining = c.deadline - now;

        if (remaining <= 0) {
          newCountdowns[c.id] = '00 : 00 : 00';
          return;
        }

        const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

        // Show days only if > 0
        if (days > 0) {
          newCountdowns[c.id] = `${days}天 ${hours.toString().padStart(2, '0')} : ${minutes.toString().padStart(2, '0')} : ${seconds.toString().padStart(2, '0')}`;
        } else {
          newCountdowns[c.id] = `${hours.toString().padStart(2, '0')} : ${minutes.toString().padStart(2, '0')} : ${seconds.toString().padStart(2, '0')}`;
        }
      });

      setCountdowns(newCountdowns);
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);
    return () => clearInterval(interval);
  }, [activeCommitments]);

  const handleDone = async (commitmentId: string) => {
    const commitment = activeCommitments.find(c => c.id === commitmentId);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await completeCommitment(commitmentId);
    setCommitmentEnergy(ENERGY_SCORES.COMMITMENT_BONUS);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 2000);
  };

  const [pendingFailCommitmentId, setPendingFailCommitmentId] = useState<string | null>(null);

  const handleFailClick = (commitmentId: string) => {
    setPendingFailCommitmentId(commitmentId);
    setShowFailModal(true);
  };

  const handleFailSubmit = async () => {
    if (!pendingFailCommitmentId) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await failCommitment(pendingFailCommitmentId, failReason, failTag || undefined);
    setShowFailModal(false);
    setPendingFailCommitmentId(null);
    setFailReason('');
    setFailTag(null);
  };

  const handleDelete = async (id: string) => {
    const commitmentToDelete = activeCommitments.find(c => c.id === id);
    if (!commitmentToDelete) return;

    const confirmed = await new Promise<boolean>((resolve) => {
      if (Platform.OS === 'web') {
        const result = confirm(
          `确定要删除此承诺吗？\n\n"${commitmentToDelete.content}"`
        );
        resolve(result);
      } else {
        Alert.alert(
          '确认删除',
          `确定要删除此承诺吗？\n\n"${commitmentToDelete.content}"`,
          [
            { text: '取消', style: 'cancel', onPress: () => resolve(false) },
            { text: '删除', style: 'destructive', onPress: () => resolve(true) },
          ]
        );
      }
    });

    if (!confirmed) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await deleteCommitment(id);
  };

  const handleCreate = async () => {
    if (!commitment || !selectedVision) return;

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    let deadline: number;
    let timeOptionVal: '1hour' | 'today' | 'week' | 'daily';

    if (timeType === 'daily') {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      deadline = today.getTime();
      timeOptionVal = 'daily';
    } else {
      const now = Date.now();
      const totalMilliseconds = (selectedDays * 24 * 60 * 60 * 1000) +
        (selectedHours * 60 * 60 * 1000) +
        (selectedMinutes * 60 * 1000);
      deadline = now + totalMilliseconds;
      timeOptionVal = 'today';
    }

    await addCommitment({
      content: commitment,
      visionId: selectedVision,
      timeOption: timeOptionVal,
      deadline,
    });

    setCommitment('');
    setSelectedDays(0);
    setSelectedHours(1);
    setSelectedMinutes(0);
    setSelectedVision(null);
    setTimeType('once');
    setScene('active');
  };

  // Success screen
  if (showSuccess) {
    return (
      <View style={styles.successContainer}>
        <Animated.View entering={FadeIn} style={styles.successContent}>
          <Text style={styles.successEmoji}>⚡️</Text>
          <Text style={styles.successTitle}>承诺已兑现！</Text>
          <Text style={styles.successSubtitle}>能量 +{commitmentEnergy} · 连胜 +1</Text>
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
        {scene === 'create' ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setScene(activeCommitments.length > 0 ? 'active' : 'empty')}
          >
            <ArrowLeft size={18} color={colors.white.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
        <Text style={styles.headerTitle}>能量加油站</Text>
        <View style={styles.headerSpacer} />
      </View>

      {scene === 'active' && activeCommitments.length > 0 && (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Commitment Stats Overview */}
          <Card style={styles.energyCard} variant="flow">
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>连续承诺天数</Text>
                <Text style={styles.streakValue}>🔥 {stats.commitmentStreak} 天</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.completionSection}>
              <View style={styles.completionHeader}>
                <Text style={styles.statLabel}>承诺完成率</Text>
                <Text style={styles.completionRatio}>
                  {stats.completedCommitments}/{stats.totalCommitments}
                </Text>
              </View>
              
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: stats.totalCommitments > 0 
                        ? `${(stats.completedCommitments / stats.totalCommitments) * 100}%` 
                        : '0%',
                      backgroundColor: colors.flow.primary,
                    }
                  ]}
                />
              </View>
              
              <Text style={styles.completionNote}>
                已完成 {stats.completedCommitments} 个 · 总计 {stats.totalCommitments} 个
              </Text>
            </View>
          </Card>

          {activeCommitments.map((commitment, index) => (
            <View key={commitment.id} style={styles.commitmentItem}>
              {commitment.timeOption === 'daily' ? (
                <View style={styles.countdownCard}>
                  <Text style={styles.countdownEmoji}>🔄</Text>
                  <View>
                    <Text style={styles.countdownLabel}>每日承诺</Text>
                    <Text style={styles.countdownValue}>
                      {commitment.lastCompletedDate === new Date().toISOString().split('T')[0]
                        ? `✅ 今日已完成`
                        : commitment.streakCount 
                          ? `连续 ${commitment.streakCount} 天 🔥` 
                          : '每天重复'}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.countdownCard}>
                  <Text style={styles.countdownEmoji}>⏰</Text>
                  <View>
                    <Text style={styles.countdownLabel}>剩余时间</Text>
                    <Text style={styles.countdownValue}>{countdowns[commitment.id] || '00 : 00 : 00'}</Text>
                  </View>
                </View>
              )}

              <Card style={styles.commitmentCard}>
                <View style={styles.commitmentHeader}>
                  <Text style={styles.commitmentLabel}>📝 我的微承诺</Text>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(commitment.id)}
                  >
                    <X size={14} color="rgba(255, 100, 100, 0.8)" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.commitmentText}>"{commitment.content}"</Text>
                <View style={styles.commitmentMeta}>
                  <View style={styles.visionTag}>
                    <Text style={styles.visionTagEmoji}>{getVisionEmoji(commitment.visionId, visions)}</Text>
                    <Text style={styles.visionTagText}>绑定愿景：{getVisionLabel(commitment.visionId, visions)}</Text>
                  </View>
                </View>
              </Card>

              {commitment.timeOption === 'daily' && 
               commitment.lastCompletedDate === new Date().toISOString().split('T')[0] ? (
                <View style={styles.completedTodayHint}>
                  <Text style={styles.completedTodayText}>🎉 今日已完成，明天继续加油！</Text>
                </View>
              ) : (
                <View style={styles.actionButtons}>
                  <Button
                    title="做到了"
                    onPress={() => handleDone(commitment.id)}
                    variant="success"
                    size="lg"
                    icon={<Check size={18} color="#FFF" />}
                    style={styles.doneButton}
                  />
                  <Button
                    title="没做到"
                    onPress={() => handleFailClick(commitment.id)}
                    variant="secondary"
                    size="lg"
                    icon={<X size={18} color={colors.white.tertiary} />}
                  />
                </View>
              )}

              {/* 承诺之间的分割线 - 最后一个不显示 */}
              {index < activeCommitments.length - 1 && (
                <View style={styles.commitmentDivider} />
              )}
            </View>
          ))}

          {activeCommitments.length < 3 && (
            <Button
              title="+ 添加新承诺"
              onPress={() => setScene('create')}
              variant="flow"
              size="lg"
              icon={<Plus size={18} color="#FFF" />}
              style={styles.addCommitmentButton}
            />
          )}
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView style={styles.content} contentContainerStyle={styles.createContentContainer}>
            <Text style={styles.createHint}>微小有力量 · 具体可执行</Text>

            {/* Step 1 */}
            <Text style={styles.stepTitle}>1 · 我要承诺做什么？</Text>
            <TextInput
              style={styles.commitmentInput}
              value={commitment}
              onChangeText={setCommitment}
              placeholder="今晚10点后不看短视频..."
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

            <View style={styles.timeTypeRow}>
              <TouchableOpacity
                style={[styles.timeTypeBtn, timeType === 'once' && styles.timeTypeBtnActive]}
                onPress={() => setTimeType('once')}
              >
                <Text style={[styles.timeTypeBtnText, timeType === 'once' && styles.timeTypeBtnTextActive]}>一次性</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.timeTypeBtn, timeType === 'daily' && styles.timeTypeBtnActive]}
                onPress={() => setTimeType('daily')}
              >
                <Text style={[styles.timeTypeBtnText, timeType === 'daily' && styles.timeTypeBtnTextActive]}>每天</Text>
              </TouchableOpacity>
            </View>

            {timeType === 'once' ? (
              <View style={styles.timePickerContainer}>
                {/* Days Picker */}
                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerLabel}>天</Text>
                  <WheelPicker
                    data={DAYS}
                    value={selectedDays}
                    onValueChanging={({ item: { value } }: any) => setSelectedDays(value)}
                    keyExtractor={(item: any) => item.value.toString()}
                    renderItem={({ item }: any) => (
                      <Text style={styles.pickerItemText}>{item.label}</Text>
                    )}
                    itemHeight={40}
                    visibleItemCount={3}
                    enableScrollByTapOnItem
                    overlayItemStyle={styles.pickerOverlay}
                  />
                </View>

                {/* Hours Picker */}
                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerLabel}>时</Text>
                  <WheelPicker
                    data={HOURS}
                    value={selectedHours}
                    onValueChanging={({ item: { value } }: any) => setSelectedHours(value)}
                    keyExtractor={(item: any) => item.value.toString()}
                    renderItem={({ item }: any) => (
                      <Text style={styles.pickerItemText}>{item.label}</Text>
                    )}
                    itemHeight={40}
                    visibleItemCount={3}
                    enableScrollByTapOnItem
                    overlayItemStyle={styles.pickerOverlay}
                  />
                </View>

                {/* Minutes Picker */}
                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerLabel}>分</Text>
                  <WheelPicker
                    data={MINUTES}
                    value={selectedMinutes}
                    onValueChanging={({ item: { value } }: any) => setSelectedMinutes(value)}
                    keyExtractor={(item: any) => item.value.toString()}
                    renderItem={({ item }: any) => (
                      <Text style={styles.pickerItemText}>{item.label}</Text>
                    )}
                    itemHeight={40}
                    visibleItemCount={3}
                    enableScrollByTapOnItem
                    overlayItemStyle={styles.pickerOverlay}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.dailyTimeDisplay}>
                <Text style={styles.dailyTimeText}>每天 · 今日24:00截止</Text>
              </View>
            )}

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
        </KeyboardAvoidingView>
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalKeyboardView}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalScrollContent}
          >
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
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
modalKeyboardView: {
    flexGrow: 1,
  },
  modalScrollContent: {
    paddingBottom: spacing.xl,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.white.primary,
    marginBottom: 24,
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.white.muted,
    marginBottom: 4,
  },
  streakValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.transform.primary,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 12,
  },
  completionSection: {
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  completionRatio: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.flow.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.flow.primary,
    borderRadius: 4,
  },
  completionNote: {
    fontSize: 11,
    color: colors.white.muted,
    textAlign: 'center',
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
  commitmentItem: {
    marginBottom: 32,
  },
  commitmentDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 16,
  },
  commitmentCard: {
    marginBottom: 16,
  },
  commitmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  commitmentLabel: {
    fontSize: 12,
    color: colors.white.muted,
  },
  deleteButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255, 60, 60, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 60, 60, 0.2)',
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
  completedTodayHint: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(0, 180, 100, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 120, 0.3)',
    alignItems: 'center',
  },
  completedTodayText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(0, 220, 140, 0.9)',
  },
  addCommitmentButton: {
    marginTop: 16,
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
  timePickerContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  timeTypeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  timeTypeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  timeTypeBtnActive: {
    backgroundColor: 'rgba(0, 180, 180, 0.2)',
    borderColor: 'rgba(0, 200, 200, 0.5)',
  },
  timeTypeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white.muted,
  },
  timeTypeBtnTextActive: {
    color: colors.flow.primary,
  },
  dailyTimeDisplay: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  dailyTimeText: {
    fontSize: 16,
    color: colors.flow.primary,
    fontWeight: '600',
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 12,
    color: colors.white.muted,
    marginBottom: 8,
  },
  pickerContent: {
    paddingVertical: 8,
  },
  pickerOverlay: {
    backgroundColor: 'rgba(0, 180, 180, 0.2)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 200, 0.5)',
  },
  pickerItemText: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.white.muted,
    fontVariant: ['tabular-nums'],
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