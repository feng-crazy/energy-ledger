// Home Page - 愿景能量罗盘
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Settings, ChevronDown, BarChart2, Zap, Brain } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/store/AppContext';
import { EnergyBall } from '@/components/EnergyBall';
import { Card } from '@/components/Card';
import { colors, typography, spacing, borderRadius } from '@/utils/theme';
import {
  getStateLabel,
  getStateEmoji,
  getVisionLabel,
  formatTime,
} from '@/utils/recordHelpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const menuItems = [
  { label: '熵减热力图', icon: BarChart2, path: '/stats' },
  { label: '能量契约', icon: Zap, path: '/contract' },
  { label: '洞察分析', icon: Brain, path: '/insights' },
];

export default function HomePage() {
  const router = useRouter();
  const { visions, records, stats } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [todayEnergy, setTodayEnergy] = useState(0);
  
  // Calculate today's energy
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = records.filter(r => {
      const recordDate = new Date(r.createdAt).toISOString().split('T')[0];
      return recordDate === today;
    });
    const total = todayRecords.reduce((sum, r) => sum + r.score, 0);
    setTodayEnergy(total);
  }, [records]);
  
  // Get recent records for display (show 5 as preview, sorted by newest first)
  const recentRecords = useMemo(() => {
    return [...records].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
  }, [records]);
  
  // Check if there are more records to show
  const hasMoreRecords = records.length > 5;
  
  const handleNavigate = (path: string) => {
    setMenuOpen(false);
    router.push(path as any);
  };
  
  const handleRecordPress = async (type: 'flow' | 'drain') => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/record?type=${type}`);
  };
  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };
  
  return (
    <View style={styles.container}>
      {/* Header - Fixed */}
      <View style={styles.header}>
        {/* Vision Pills */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.visionScroll}
          contentContainerStyle={styles.visionPills}
        >
          {visions.slice(0, 3).map((v) => (
            <View
              key={v.id}
              style={[
                styles.visionPill,
                styles.visionPillActive,
              ]}
            >
              <Text style={[
                styles.visionPillText,
                styles.visionPillTextActive,
              ]}>
                {v.title}
              </Text>
            </View>
          ))}
        </ScrollView>
        
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => router.push('/vision')}
        >
          <Image 
            source={require('../../assets/favicon.png')} 
            style={styles.visionIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
      
      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Energy Ball */}
        <View style={styles.energyBallContainer}>
          <EnergyBall 
            score={todayEnergy}
            onPress={() => handleRecordPress('flow')}
          />
          <Text style={styles.tapHint}>点击球体开始记录</Text>
          
          {/* Streak */}
          <View style={styles.streakContainer}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>连续觉察 {stats.streak} 天</Text>
          </View>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.drainButton}
            onPress={() => handleRecordPress('drain')}
            activeOpacity={0.9}
          >
            <Text style={styles.drainEmoji}>🌫️</Text>
            <Text style={styles.drainTitle}>感觉不对 / 内耗</Text>
            <Text style={styles.drainSubtitle}>觉知即功 +5</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.flowButton}
            onPress={() => handleRecordPress('flow')}
            activeOpacity={0.9}
          >
            <Text style={styles.flowEmoji}>🌊</Text>
            <Text style={styles.flowTitle}>感觉对劲 / 心流</Text>
            <Text style={styles.flowSubtitle}>顺势而为 +5</Text>
          </TouchableOpacity>
        </View>
        
        {/* Recent Records */}
        {recentRecords.length > 0 && (
          <View style={styles.recentRecords}>
            <View style={styles.recentHeader}>
              <Text style={styles.recentLabel}>觉察记录</Text>
              {hasMoreRecords && (
                <TouchableOpacity onPress={() => router.push('/records')} style={styles.viewAllButton}>
                  <Text style={styles.viewAllText}>查看全部</Text>
                  <ChevronDown size={14} color={colors.flow.primary} style={{ transform: [{ rotate: '-90deg' }] }} />
                </TouchableOpacity>
              )}
            </View>
            {recentRecords.map((record) => (
              <TouchableOpacity
                key={record.id}
                activeOpacity={0.7}
                onPress={() => router.push(`/record-detail?id=${record.id}`)}
              >
                <Card style={styles.recordCard}>
                  <View style={styles.recordContent}>
                    <View style={[
                      styles.recordDot,
                      { backgroundColor: record.type === 'flow' ? colors.flow.primary : colors.drain.primary }
                    ]} />
                    <Text style={styles.recordState}>
                      {getStateEmoji(record.type, record.bodyStateId)} {getStateLabel(record.type, record.bodyStateId, record.customBodyState)}
                    </Text>
                    {record.visions[0] && (
                      <Text style={styles.recordVision}>{getVisionLabel(record.visions[0], visions)}</Text>
                    )}
                    <Text style={styles.recordScore}>+{record.score}</Text>
                    <Text style={styles.recordTime}>{formatTime(record.createdAt)}</Text>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: 56,
    paddingBottom: spacing.xs,
  },
  settingsButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  visionIcon: {
    width: 20,
    height: 20,
  },
  visionScroll: {
    marginTop: spacing.xs,
  },
  visionPills: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  visionPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  visionPillActive: {
    backgroundColor: 'rgba(0, 212, 212, 0.15)',
    borderColor: 'rgba(0, 212, 212, 0.4)',
  },
  visionPillText: {
    fontSize: 11,
    color: colors.white.muted,
  },
  visionPillTextActive: {
    color: colors.flow.primary,
  },
  energyBallContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.lg,
    minHeight: 280,
  },
  tapHint: {
    fontSize: 13,
    color: colors.white.muted,
    marginTop: spacing.md,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 180, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 180, 0, 0.2)',
  },
  streakEmoji: {
    fontSize: 16,
  },
  streakText: {
    fontSize: 13,
    color: 'rgba(255, 200, 80, 0.9)',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    marginBottom: spacing.md,
  },
  drainButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 24,
    borderRadius: borderRadius['3xl'],
    backgroundColor: 'linear-gradient(135deg, rgba(120, 40, 160, 0.4) 0%, rgba(80, 20, 120, 0.3) 100%)',
    borderWidth: 1,
    borderColor: 'rgba(160, 80, 220, 0.3)',
  },
  drainEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  drainTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(200, 150, 255, 0.95)',
  },
  drainSubtitle: {
    fontSize: 10,
    color: 'rgba(160, 100, 220, 0.7)',
    marginTop: 4,
  },
  flowButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 24,
    borderRadius: borderRadius['3xl'],
    backgroundColor: 'linear-gradient(135deg, rgba(0, 140, 140, 0.4) 0%, rgba(0, 100, 120, 0.3) 100%)',
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 200, 0.3)',
  },
  flowEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  flowTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(80, 230, 220, 0.95)',
  },
  flowSubtitle: {
    fontSize: 10,
    color: 'rgba(0, 180, 180, 0.7)',
    marginTop: 4,
  },
  recentRecords: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingLeft: 4,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 11,
    color: colors.flow.primary,
    fontWeight: '500',
  },
  recentLabel: {
    fontSize: 11,
    color: colors.white.muted,
    marginBottom: 8,
    paddingLeft: 4,
  },
  recordCard: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  recordContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recordDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recordState: {
    flex: 1,
    fontSize: 12,
    color: colors.white.secondary,
  },
  recordVision: {
    fontSize: 11,
    color: colors.white.muted,
  },
  recordScore: {
    fontSize: 11,
    color: colors.flow.primary,
    marginLeft: 8,
  },
  recordTime: {
    fontSize: 10,
    color: colors.white.subtle,
    marginLeft: 8,
  },
});