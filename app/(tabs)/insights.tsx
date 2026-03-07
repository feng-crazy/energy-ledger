// Insights Page - 洞察分析
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, ChevronRight, Brain, Settings } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { 
  FadeIn, 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useApp } from '@/store/AppContext';
import { Card } from '@/components/Card';
import { AiConfigModal } from '@/components/AiConfigModal';
import { colors, borderRadius } from '@/utils/theme';
import { generateAiReport, isAiReportAvailable } from '@/utils/aiReport';
import {
  getStateLabel,
  getStateEmoji,
  getVisionLabel,
  getVisionEmoji,
  formatDateTime,
} from '@/utils/recordHelpers';

function LoadingSpinner() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.loadingSpinner, animatedStyle]} />
  );
}

export default function InsightsPage() {
  const router = useRouter();
  const { records, visions, updateRecordAiReport, aiConfig, saveAiConfig, clearAiConfig } = useApp();
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  
const handleAnalyze = async (recordId: string) => {
    const record = records.find(r => r.id === recordId);
    if (!record || record.hasAiReport || !aiConfig) return;
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAnalyzingId(recordId);
    
    try {
      const report = await generateAiReport(record, aiConfig);
      await updateRecordAiReport(recordId, report);
    } catch (error) {
      console.error('Failed to generate AI report:', error);
    } finally {
      setAnalyzingId(null);
      setExpandedId(recordId);
    }
  };
  
  // Pagination state
  const PAGE_SIZE = 20;
  const [displayedCount, setDisplayedCount] = useState(PAGE_SIZE);
  
  // Get displayed records (pagination)
  const displayedRecords = useMemo(() => {
    return records.slice(0, displayedCount);
  }, [records, displayedCount]);
  
  // Check if there are more records to load
  const hasMoreRecords = displayedCount < records.length;
  
  // Load more records
  const loadMore = () => {
    if (hasMoreRecords) {
      setDisplayedCount(prev => prev + PAGE_SIZE);
    }
  };
  
return (
    <View style={styles.container}>
      <AiConfigModal
        visible={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        config={aiConfig}
        onSave={saveAiConfig}
        onClear={clearAiConfig}
      />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>洞察分析</Text>
          <Text style={styles.headerSubtitle}>你的私人能量教练</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowConfigModal(true);
          }}
        >
          <Settings size={22} color={aiConfig ? colors.flow.primary : colors.white.muted} />
        </TouchableOpacity>
      </View>
      
      {/* AI Banner */}
      <View style={[styles.aiBanner, !isAiReportAvailable() && styles.aiBannerDisabled]}>
        <View style={styles.aiIconContainer}>
          <Brain size={20} color={isAiReportAvailable() ? "rgba(180, 140, 255, 0.9)" : "rgba(100, 100, 100, 0.5)"} />
        </View>
        <View>
          <Text style={[styles.aiBannerTitle, !isAiReportAvailable() && styles.aiBannerTitleDisabled]}>
            {!isAiReportAvailable() 
              ? 'AI 报告功能不可用' 
              : aiConfig 
                ? 'AI 深度洞察已就绪' 
                : '请先配置 AI 服务'}
          </Text>
          <Text style={styles.aiBannerSubtitle}>
            {!isAiReportAvailable() 
              ? '生产环境 Web 端暂不支持此功能' 
              : aiConfig 
                ? '从哲学 · 灵性修行 · 神经科学角度分析' 
                : '点击右上角设置图标进行配置'}
          </Text>
        </View>
      </View>
      
      <FlatList
        data={displayedRecords}
        keyExtractor={(item) => item.id}
        renderItem={({ item: record }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push(`/record-detail?id=${record.id}`)}
          >
            <Card style={styles.recordCard}>
              {/* Record Header */}
              <View style={styles.recordHeader}>
                <View style={styles.recordHeaderLeft}>
                  <View 
                    style={[
                      styles.recordDot,
                      { backgroundColor: record.type === 'flow' ? colors.flow.primary : colors.drain.primary }
                    ]} 
                  />
                  <Text style={styles.recordState}>
                    {getStateEmoji(record.type, record.bodyStateId)} {getStateLabel(record.type, record.bodyStateId, record.customBodyState)}
                  </Text>
                </View>
                <Text style={styles.recordTime}>{formatDateTime(record.createdAt)}</Text>
              </View>
              
              {/* Vision Tags */}
              {record.visions.length > 0 && (
                <View style={styles.visionTags}>
                  {record.visions.slice(0, 2).map((visionId) => (
                    <View key={visionId} style={styles.visionTag}>
                      <Text style={styles.visionTagEmoji}>{getVisionEmoji(visionId, visions)}</Text>
                      <Text style={styles.visionTagText}>{getVisionLabel(visionId, visions)}</Text>
                    </View>
                  ))}
                </View>
              )}
              
              {/* Content Preview */}
              <Text style={styles.recordContent} numberOfLines={2}>
                {record.journal || record.customBodyState || '暂无详细记录'}
              </Text>
              
              {/* AI Analysis Button */}
              {!record.hasAiReport && aiConfig && isAiReportAvailable() && (
                <TouchableOpacity
                  style={styles.analyzeButton}
                  onPress={() => handleAnalyze(record.id)}
                  disabled={analyzingId === record.id}
                >
                  {analyzingId === record.id ? (
                    <>
                      <LoadingSpinner />
                      <Text style={styles.analyzeButtonText}>AI 深度分析中...</Text>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} color="rgba(200, 170, 255, 0.8)" />
                      <Text style={styles.analyzeButtonText}>AI 深度分析</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
              
              {/* AI Report */}
              {record.hasAiReport && record.aiReport && (
                <View>
                  <TouchableOpacity
                    style={styles.reportToggle}
                    onPress={() => setExpandedId(expandedId === record.id ? null : record.id)}
                  >
                    <View style={styles.reportToggleLeft}>
                      <Sparkles size={14} color="rgba(180, 140, 255, 0.8)" />
                      <Text style={styles.reportToggleText}>查看 AI 洞察报告</Text>
                    </View>
                    <ChevronRight
                      size={16}
                      color="rgba(160, 120, 220, 0.6)"
                      style={{
                        transform: [{ rotate: expandedId === record.id ? '90deg' : '0deg' }],
                      }}
                    />
                  </TouchableOpacity>
                  
                  {expandedId === record.id && (
                    <Animated.View entering={FadeIn} style={styles.reportContent}>
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
                    </Animated.View>
                  )}
                </View>
              )}
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={styles.emptyTitle}>还没有记录</Text>
            <Text style={styles.emptySubtitle}>开始记录你的能量状态，AI 将为你提供深度洞察</Text>
          </View>
        }
        ListFooterComponent={
          hasMoreRecords ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={colors.flow.primary} />
            </View>
          ) : (
            <View style={styles.footer}>
              <Text style={styles.footerText}>— 没有更多记录了 —</Text>
            </View>
          )
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white.primary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.white.muted,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: colors.white.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: borderRadius.xl,
    backgroundColor: 'linear-gradient(135deg, rgba(80, 40, 160, 0.3) 0%, rgba(40, 20, 100, 0.2) 100%)',
    borderWidth: 1,
    borderColor: 'rgba(120, 80, 220, 0.3)',
  },
  aiIconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(120, 80, 220, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(160, 120, 255, 0.3)',
  },
  aiBannerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(200, 170, 255, 0.9)',
  },
  aiBannerSubtitle: {
    fontSize: 11,
    color: 'rgba(160, 120, 220, 0.7)',
    marginTop: 2,
  },
  aiBannerDisabled: {
    backgroundColor: 'rgba(60, 60, 60, 0.2)',
    borderColor: 'rgba(100, 100, 100, 0.3)',
  },
  aiBannerTitleDisabled: {
    color: 'rgba(120, 120, 120, 0.8)',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white.primary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.white.muted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 40,
  },
  recordCard: {
    marginBottom: 16,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recordHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recordState: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white.primary,
  },
  recordTime: {
    fontSize: 10,
    color: colors.white.subtle,
  },
  visionTags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  visionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0, 180, 180, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 200, 0.2)',
  },
  visionTagEmoji: {
    fontSize: 11,
  },
  visionTagText: {
    fontSize: 10,
    color: 'rgba(0, 200, 200, 0.8)',
  },
  recordContent: {
    fontSize: 13,
    color: colors.white.secondary,
    lineHeight: 22,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(120, 80, 220, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(160, 120, 255, 0.3)',
  },
  analyzeButtonText: {
    fontSize: 13,
    color: 'rgba(200, 170, 255, 0.8)',
  },
  loadingSpinner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(160, 120, 255, 0.8)',
    borderTopColor: 'transparent',
  },
  reportToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  reportToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reportToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(200, 170, 255, 0.8)',
  },
  reportContent: {
    marginTop: 12,
    padding: 16,
    borderRadius: borderRadius.xl,
    backgroundColor: 'linear-gradient(135deg, rgba(60, 30, 120, 0.3) 0%, rgba(30, 15, 80, 0.2) 100%)',
    borderWidth: 1,
    borderColor: 'rgba(120, 80, 220, 0.15)',
  },
  reportSection: {
    marginBottom: 16,
  },
  reportSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(180, 140, 255, 0.8)',
    marginBottom: 6,
  },
  reportSectionText: {
    fontSize: 12,
    color: colors.white.muted,
    lineHeight: 20,
  },
  suggestionSection: {
    marginBottom: 0,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 180, 180, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 200, 0.15)',
  },
  suggestionText: {
    fontSize: 12,
    color: 'rgba(0, 220, 200, 0.8)',
    lineHeight: 20,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.white.muted,
  },
});