// Record Detail Page - 记录详情
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Sparkles, ChevronRight, Trash2 } from 'lucide-react-native';
import { useApp } from '@/store/AppContext';
import { Card } from '@/components/Card';
import { colors, borderRadius } from '@/utils/theme';
import { isAiReportAvailable } from '@/utils/aiReport';
import {
  getStateLabel,
  getStateEmoji,
  getVisionLabel,
  getVisionEmoji,
} from '@/utils/recordHelpers';

export default function RecordDetailPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { records, visions, aiConfig, deleteRecord } = useApp();
  const [expanded, setExpanded] = useState(false);

  const record = records.find(r => r.id === params.id);

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

    if (isToday) return `今天 ${timeStr}`;
    if (date.toDateString() === yesterday.toDateString()) return `昨天 ${timeStr}`;
    return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${timeStr}`;
  };

  const handleDelete = () => {
    Alert.alert(
      '确认删除',
      '确定要删除这条记录吗？此操作无法撤销。',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            if (record) {
              await deleteRecord(record.id);
              router.back();
            }
          },
        },
      ]
    );
  };

  if (!record) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={18} color={colors.white.primary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>记录详情</Text>
          </View>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundEmoji}>📝</Text>
          <Text style={styles.notFoundText}>记录不存在</Text>
        </View>
      </View>
    );
  }

  const isFlow = record.type === 'flow';

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
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>记录详情</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Trash2 size={18} color={colors.drain.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* State Card */}
        <Card style={styles.stateCard}>
          <View style={styles.stateHeader}>
            <View style={styles.stateHeaderLeft}>
              <Text style={styles.stateEmojiLarge}>
                {getStateEmoji(record.type, record.bodyStateId)}
              </Text>
              <View>
                <Text style={styles.stateLabelLarge}>
                  {getStateLabel(record.type, record.bodyStateId, record.customBodyState)}
                </Text>
                <Text style={[
                  styles.stateType,
                  { color: isFlow ? colors.flow.primary : colors.drain.primary },
                ]}>
                  {isFlow ? '🌊 聚能态' : '🌫️ 耗散态'}
                </Text>
              </View>
            </View>
            <View style={[
              styles.scoreBadge,
              {
                backgroundColor: isFlow
                  ? 'rgba(0, 180, 180, 0.2)'
                  : 'rgba(160, 80, 220, 0.2)',
              },
            ]}>
              <Text style={[
                styles.scoreText,
                { color: isFlow ? colors.flow.primary : colors.drain.primary },
              ]}>
                {record.score > 0 ? '+' : ''}{record.score}
              </Text>
            </View>
          </View>
        </Card>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>记录时间</Text>
          <Text style={styles.sectionValue}>{formatDateTime(record.createdAt)}</Text>
        </View>

        {/* Visions */}
        {record.visions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>关联愿景</Text>
            <View style={styles.visionList}>
              {record.visions.map((visionId) => (
                <View key={visionId} style={styles.visionItem}>
                  <Text style={styles.visionEmoji}>{getVisionEmoji(visionId, visions)}</Text>
                  <Text style={styles.visionText}>{getVisionLabel(visionId, visions)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Journal */}
        {(record.journal || record.customBodyState) && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>内心活动</Text>
            <Card style={styles.journalCard}>
              <Text style={styles.journalText}>
                {record.journal || record.customBodyState || '无详细记录'}
              </Text>
            </Card>
          </View>
        )}

        {/* AI Analysis */}
        {aiConfig && isAiReportAvailable() && record.hasAiReport && record.aiReport && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>AI 深度洞察</Text>

            <View>
              <TouchableOpacity
                style={styles.reportToggle}
                onPress={() => setExpanded(!expanded)}
              >
                <View style={styles.reportToggleLeft}>
                  <Sparkles size={16} color="rgba(180, 140, 255, 0.8)" />
                  <Text style={styles.reportToggleText}>查看 AI 洞察报告</Text>
                </View>
                <ChevronRight
                  size={16}
                  color="rgba(160, 120, 220, 0.6)"
                  style={{
                    transform: [{ rotate: expanded ? '90deg' : '0deg' }],
                  }}
                />
              </TouchableOpacity>

              {expanded && (
                <View style={styles.reportContent}>
                  <View style={styles.reportSection}>
                    <Text style={styles.reportSectionTitle}>🏛️ 哲学视角</Text>
                    <Text style={styles.reportSectionText}>
                      {record.aiReport.philosophy}
                    </Text>
                  </View>

                  <View style={styles.reportSection}>
                    <Text style={styles.reportSectionTitle}>🧠 神经科学</Text>
                    <Text style={styles.reportSectionText}>
                      {record.aiReport.neuroscience}
                    </Text>
                  </View>

                  <View style={[styles.reportSection, styles.suggestionSection]}>
                    <Text style={styles.reportSectionTitle}>💡 个性化建议</Text>
                    <Text style={styles.suggestionText}>
                      {record.aiReport.suggestion}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white.primary,
  },
  headerPlaceholder: {
    width: 36,
    height: 36,
  },
  deleteButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  notFoundText: {
    fontSize: 16,
    color: colors.white.secondary,
  },
  stateCard: {
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  stateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stateHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stateEmojiLarge: {
    fontSize: 32,
  },
  stateLabelLarge: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white.primary,
    marginBottom: 4,
  },
  stateType: {
    fontSize: 12,
    fontWeight: '500',
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    marginTop: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.white.muted,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionValue: {
    fontSize: 14,
    color: colors.white.secondary,
  },
  visionList: {
    gap: 8,
  },
  visionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  visionEmoji: {
    fontSize: 16,
  },
  visionText: {
    fontSize: 14,
    color: colors.white.primary,
  },
  journalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  journalText: {
    fontSize: 14,
    color: colors.white.secondary,
    lineHeight: 24,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(120, 80, 220, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(160, 120, 255, 0.3)',
  },
  analyzeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(200, 170, 255, 0.9)',
  },
  loadingSpinner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: 'rgba(160, 120, 255, 0.8)',
    borderTopColor: 'transparent',
  },
  reportToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(120, 80, 220, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(160, 120, 255, 0.2)',
  },
  reportToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reportToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(200, 170, 255, 0.8)',
  },
  reportContent: {
    marginTop: 12,
    padding: 16,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(60, 30, 120, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(120, 80, 220, 0.15)',
    gap: 16,
  },
  reportSection: {
    gap: 6,
  },
  reportSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(180, 140, 255, 0.9)',
  },
  reportSectionText: {
    fontSize: 13,
    color: colors.white.muted,
    lineHeight: 22,
  },
  suggestionSection: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(180, 140, 255, 0.1)',
  },
  suggestionText: {
    fontSize: 13,
    color: 'rgba(0, 220, 200, 0.85)',
    lineHeight: 22,
  },
});
