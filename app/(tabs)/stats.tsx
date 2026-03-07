// Stats Page - 熵减热力图
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useApp } from '@/store/AppContext';
import { Card } from '@/components/Card';
import { colors, spacing, borderRadius } from '@/utils/theme';
import { DailyRecordData, RadarData } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const periods = ['今日', '本周'];

export default function StatsPage() {
  const { records, visions, stats } = useApp();
  const [period, setPeriod] = useState(0);
  
  // Calculate stats from real data
  const calculateTodayEnergy = () => {
    const today = new Date().toISOString().split('T')[0];
    return records
      .filter(r => new Date(r.createdAt).toISOString().split('T')[0] === today)
      .reduce((sum, r) => sum + r.score, 0);
  };
  
  const getTodayRecordCount = () => {
    const today = new Date().toISOString().split('T')[0];
    return records.filter(r => new Date(r.createdAt).toISOString().split('T')[0] === today).length;
  };
  
  // Generate chart data based on period
  const getChartData = (): DailyRecordData[] => {
    if (period === 0) {
      // Today - hourly
      const today = new Date();
      const data: DailyRecordData[] = [];
      for (let i = 6; i <= 21; i++) {
        const hourRecords = records.filter(r => {
          const date = new Date(r.createdAt);
          return date.getDate() === today.getDate() && date.getHours() === i;
        });
        const energy = hourRecords.filter(r => r.type === 'flow').reduce((s, r) => s + r.score, 0);
        const drain = Math.abs(hourRecords.filter(r => r.type === 'drain').reduce((s, r) => s + r.score, 0));
        data.push({ time: `${i.toString().padStart(2, '0')}`, energy, drain });
      }
      return data;
    } else {
      // Week
      const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const today = new Date();
      const data: DailyRecordData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayRecords = records.filter(r => {
          const rDate = new Date(r.createdAt);
          return rDate.toDateString() === date.toDateString();
        });
        const energy = dayRecords.filter(r => r.type === 'flow').reduce((s, r) => s + r.score, 0);
        const drain = Math.abs(dayRecords.filter(r => r.type === 'drain').reduce((s, r) => s + r.score, 0));
        data.push({ time: days[date.getDay()], energy, drain });
      }
      return data;
    }
  };
  
  // Vision radar data
  const getRadarData = (): RadarData[] => {
    if (visions.length === 0) return [];
    
    return visions.map(vision => {
      const totalScore = vision.energyScore;
      const stage = Math.floor(totalScore / 100) + 1;
      const progressValue = totalScore > 0 && totalScore % 100 === 0 
        ? 100 
        : totalScore % 100;
      
      return {
        vision: vision.title,
        value: progressValue,
        fullMark: 100,
        stage: stage,
        totalScore: totalScore,
      };
    });
  };
  
  const chartData = getChartData();
  const radarData = getRadarData();
  
return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>熵减热力图</Text>
      </View>
      
      {/* Period Toggle */}
      <View style={styles.periodToggle}>
        {periods.map((p, i) => (
          <TouchableOpacity
            key={p}
            style={[
              styles.periodButton,
              period === i && styles.periodButtonActive,
            ]}
            onPress={() => setPeriod(i)}
          >
            <Text style={[
              styles.periodButtonText,
              period === i && styles.periodButtonTextActive,
            ]}>
              {p}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: colors.flow.primary }]}>
              +{stats.totalEnergy}
            </Text>
            <Text style={styles.summaryLabel}>总能量</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{records.length}</Text>
            <Text style={styles.summaryLabel}>记录次数</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: colors.transform.primary }]}>
              {stats.maxStreak}天
            </Text>
            <Text style={styles.summaryLabel}>最高连胜</Text>
          </View>
        </View>
        
        {/* Time Axis Chart (Simplified) */}
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>能量时间轴</Text>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.flow.primary }]} />
                <Text style={styles.legendText}>聚能</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.drain.primary }]} />
                <Text style={styles.legendText}>耗散</Text>
              </View>
            </View>
          </View>
          
          {/* Simple bar chart visualization */}
          <View style={styles.barChart}>
            {chartData.slice(0, 8).map((d, i) => {
              const maxVal = Math.max(...chartData.map(c => Math.max(c.energy, c.drain)), 1);
              const energyHeight = (d.energy / maxVal) * 100;
              const drainHeight = (d.drain / maxVal) * 100;
              
              return (
                <View key={i} style={styles.barColumn}>
                  <View style={styles.bars}>
                    <View 
                      style={[
                        styles.bar, 
                        { 
                          height: drainHeight,
                          backgroundColor: colors.drain.primary,
                          opacity: 0.7,
                        }
                      ]} 
                    />
                    <View 
                      style={[
                        styles.bar, 
                        { 
                          height: energyHeight,
                          backgroundColor: colors.flow.primary,
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.barLabel}>{d.time}</Text>
                </View>
              );
            })}
          </View>
        </Card>
        
        {/* Vision Radar */}
        <Card style={styles.radarCard}>
          <Text style={styles.chartTitle}>愿景能量雷达</Text>
          <Text style={styles.chartSubtitle}>各愿景维度的能量净值</Text>
          
          {radarData.length > 0 ? (
            <View style={styles.radarBars}>
              {radarData.map((d, i) => (
                <View key={d.vision} style={styles.radarRow}>
                  <Text style={styles.radarLabel}>{d.vision}</Text>
                  <View style={styles.radarBarContainer}>
                    <View style={styles.radarBarBg}>
                      <View 
                        style={[
                          styles.radarBarFill,
                          { 
                            width: `${d.value}%`,
                            backgroundColor: colors.flow.primary,
                          }
                        ]} 
                      />
                    </View>
                    {d.stage !== undefined && d.stage > 0 && (
                      <View style={styles.radarStageBadge}>
                        <Text style={styles.radarStageText}>阶段{d.stage}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.radarValue}>
                    {d.totalScore !== undefined ? d.totalScore : Math.round(d.value)} pts
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>暂无愿景数据</Text>
          )}     
        </Card>
        
        {/* Heatmap (Simplified) */}
        <Card style={styles.heatmapCard}>
          <Text style={styles.chartTitle}>本月记录热图</Text>
          <View style={styles.heatmapGrid}>
            {Array.from({ length: 28 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - (27 - i));
              const dayRecords = records.filter(r => {
                const rDate = new Date(r.createdAt);
                return rDate.toDateString() === date.toDateString();
              });
              const hasRecord = dayRecords.length > 0;
              const score = dayRecords.reduce((s, r) => s + r.score, 0);
              
              return (
                <View
                  key={i}
                  style={[
                    styles.heatmapCell,
                    hasRecord && score > 0 && { backgroundColor: `rgba(0, 212, 212, ${0.2 + (Math.min(score, 30) / 30) * 0.6})` },
                    hasRecord && score <= 0 && { backgroundColor: 'rgba(160, 80, 220, 0.4)' },
                  ]}
                >
                  <Text style={styles.heatmapDay}>{date.getDate()}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.heatmapLegend}>
            <Text style={styles.heatmapLegendText}>耗散</Text>
            <View style={styles.heatmapLegendGradient}>
              <View style={[styles.heatmapLegendCell, { backgroundColor: 'rgba(160, 80, 220, 0.6)' }]} />
              <View style={[styles.heatmapLegendCell, { backgroundColor: 'rgba(0, 80, 100, 0.4)' }]} />
              <View style={[styles.heatmapLegendCell, { backgroundColor: 'rgba(0, 160, 160, 0.6)' }]} />
              <View style={[styles.heatmapLegendCell, { backgroundColor: 'rgba(0, 212, 212, 0.9)' }]} />
            </View>
            <Text style={styles.heatmapLegendText}>聚能</Text>
          </View>
        </Card>
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
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white.primary,
  },
  periodToggle: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: 'rgba(0, 180, 180, 0.2)',
    borderColor: 'rgba(0, 200, 200, 0.5)',
  },
  periodButtonText: {
    fontSize: 14,
    color: colors.white.muted,
  },
  periodButtonTextActive: {
    color: colors.flow.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    padding: 12,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white.primary,
  },
  summaryLabel: {
    fontSize: 10,
    color: colors.white.muted,
    marginTop: 2,
  },
  chartCard: {
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white.secondary,
  },
  chartSubtitle: {
    fontSize: 11,
    color: colors.white.muted,
    marginBottom: 12,
  },
  chartLegend: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 12,
    height: 4,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 10,
    color: colors.white.muted,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
    paddingHorizontal: 8,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  bars: {
    flexDirection: 'row',
    gap: 2,
    height: 140,
    alignItems: 'flex-end',
  },
  bar: {
    width: 8,
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: colors.white.muted,
    marginTop: 4,
  },
  radarCard: {
    marginBottom: 16,
  },
  radarBars: {
    marginTop: 12,
  },
  radarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radarLabel: {
    width: 50,
    fontSize: 11,
    color: colors.white.secondary,
  },
  radarLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 50,
  },
  radarBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    gap: 8,
  },
  radarStage: {
    fontSize: 9,
    color: colors.transform.primary,
  },
  radarStageBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(160, 80, 220, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(160, 80, 220, 0.4)',
  },
  radarStageText: {
    fontSize: 9,
    color: colors.transform.primary,
    fontWeight: '500',
  },
  radarBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    marginHorizontal: 8,
  },
  radarBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  radarValue: {
    width: 30,
    fontSize: 11,
    color: colors.white.muted,
    textAlign: 'right',
  },
  emptyText: {
    fontSize: 13,
    color: colors.white.muted,
    textAlign: 'center',
    paddingVertical: 24,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(220, 60, 60, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(220, 60, 60, 0.2)',
    marginTop: 8,
  },
  warningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(220, 100, 100, 0.8)',
  },
  warningText: {
    fontSize: 12,
    color: 'rgba(220, 120, 120, 0.8)',
    flex: 1,
  },
  heatmapCard: {
    marginBottom: 16,
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  heatmapCell: {
    width: (SCREEN_WIDTH - 76) / 7,
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heatmapDay: {
    fontSize: 9,
    color: colors.white.subtle,
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  heatmapLegendText: {
    fontSize: 10,
    color: colors.white.muted,
  },
  heatmapLegendGradient: {
    flexDirection: 'row',
    gap: 4,
  },
  heatmapLegendCell: {
    width: 16,
    height: 12,
    borderRadius: 4,
  },
});