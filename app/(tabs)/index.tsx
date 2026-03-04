// Home Page - 愿景能量罗盘
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Settings, ChevronDown, BarChart2, Zap, Brain } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/store/AppContext';
import { EnergyBall } from '@/components/EnergyBall';
import { Card } from '@/components/Card';
import { colors, typography, spacing, borderRadius } from '@/utils/theme';
import { DRAIN_STATES, FLOW_STATES } from '@/types';

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
  
  // Get today's records for display
  const todayRecords = records.filter(r => {
    const today = new Date().toISOString().split('T')[0];
    const recordDate = new Date(r.createdAt).toISOString().split('T')[0];
    return recordDate === today;
  }).slice(0, 3);
  
  const handleNavigate = (path: string) => {
    setMenuOpen(false);
    router.push(path as any);
  };
  
  const handleRecordPress = async (type: 'flow' | 'drain') => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/record?type=${type}`);
  };
  
  const getStateLabel = (type: string, stateId: string) => {
    const states = type === 'flow' ? FLOW_STATES : DRAIN_STATES;
    const state = states.find(s => s.id === stateId);
    return state?.label || '自定义';
  };
  
  const getStateEmoji = (type: string, stateId: string) => {
    const states = type === 'flow' ? FLOW_STATES : DRAIN_STATES;
    const state = states.find(s => s.id === stateId);
    return state?.emoji || '✍️';
  };
  
  const getVisionLabel = (visionId: string) => {
    const vision = visions.find(v => v.id === visionId);
    return vision?.label || '';
  };
  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.menuContainer}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setMenuOpen(!menuOpen)}
          >
            <View style={styles.statusDot} />
            <Text style={styles.menuLabel}>功过格</Text>
            <ChevronDown 
              size={14} 
              color={colors.white.muted}
              style={{ transform: [{ rotate: menuOpen ? '180deg' : '0deg' }] }}
            />
          </TouchableOpacity>
          
          {menuOpen && (
            <View style={styles.dropdown}>
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity
                    key={item.path}
                    style={styles.dropdownItem}
                    onPress={() => handleNavigate(item.path)}
                  >
                    <Icon size={15} color={colors.flow.primary} />
                    <Text style={styles.dropdownItemText}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
        
        <View style={styles.energyDisplay}>
          <Text style={styles.energyLabel}>今日能量</Text>
          <Text style={styles.energyValue}>+{todayEnergy} pts</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => router.push('/vision')}
        >
          <Settings size={16} color={colors.white.tertiary} />
        </TouchableOpacity>
      </View>
      
      {/* Vision Pills */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.visionScroll}
        contentContainerStyle={styles.visionPills}
      >
        {visions.slice(0, 5).map((v, i) => (
          <View
            key={v.id}
            style={[
              styles.visionPill,
              i === 0 && styles.visionPillActive,
            ]}
          >
            <Text style={[
              styles.visionPillText,
              i === 0 && styles.visionPillTextActive,
            ]}>
              {v.label}
            </Text>
          </View>
        ))}
      </ScrollView>
      
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
        
        {/* Center Transform Button */}
        <TouchableOpacity
          style={styles.transformButton}
          onPress={() => handleRecordPress('transform')}
        >
          <Zap size={20} color="rgba(255, 220, 80, 0.95)" />
        </TouchableOpacity>
      </View>
      
      {/* Recent Records */}
      {todayRecords.length > 0 && (
        <View style={styles.recentRecords}>
          <Text style={styles.recentLabel}>今日记录</Text>
          {todayRecords.map((record, i) => (
            <Card key={record.id} style={styles.recordCard}>
              <View style={styles.recordContent}>
                <View style={[
                  styles.recordDot,
                  { backgroundColor: record.type === 'flow' ? colors.flow.primary : colors.drain.primary }
                ]} />
                <Text style={styles.recordState}>
                  {getStateEmoji(record.type, record.bodyStateId)} {getStateLabel(record.type, record.bodyStateId)}
                </Text>
                {record.visions[0] && (
                  <Text style={styles.recordVision}>{getVisionLabel(record.visions[0])}</Text>
                )}
                <Text style={styles.recordScore}>+{record.score}</Text>
                <Text style={styles.recordTime}>{formatTime(record.createdAt)}</Text>
              </View>
            </Card>
          ))}
        </View>
      )}
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
    paddingHorizontal: spacing.xl,
    paddingTop: 56,
    paddingBottom: spacing.sm,
  },
  menuContainer: {
    position: 'relative',
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.flow.primary,
    shadowColor: colors.flow.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
  },
  menuLabel: {
    fontSize: 13,
    color: colors.white.secondary,
  },
  dropdown: {
    position: 'absolute',
    top: 48,
    left: 0,
    minWidth: 160,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(15, 20, 50, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: spacing.xs,
    zIndex: 50,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownItemText: {
    fontSize: 13,
    color: colors.white.secondary,
  },
  energyDisplay: {
    alignItems: 'center',
  },
  energyLabel: {
    fontSize: 12,
    color: colors.white.muted,
  },
  energyValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.flow.primary,
  },
  settingsButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  visionScroll: {
    marginTop: spacing.sm,
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapHint: {
    fontSize: 13,
    color: colors.white.muted,
    marginTop: 12,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 16,
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
    marginBottom: 16,
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
  transformButton: {
    position: 'absolute',
    top: -16,
    left: '50%',
    marginLeft: -24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: 'rgba(255, 200, 0, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 200, 0, 0.6)',
  },
  recentRecords: {
    paddingHorizontal: 16,
    marginBottom: 24,
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