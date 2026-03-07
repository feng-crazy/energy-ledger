// Records List Page - 记录列表
import { useState, useMemo } from 'react';
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
import { ArrowLeft } from 'lucide-react-native';
import { useApp } from '@/store/AppContext';
import { Card } from '@/components/Card';
import { colors, borderRadius } from '@/utils/theme';
import { EnergyRecord } from '@/types';
import {
  getStateLabel,
  getStateEmoji,
  getVisionLabel,
  getVisionEmoji,
  formatDate,
  formatTime,
} from '@/utils/recordHelpers';

const PAGE_SIZE = 2; // 临时改为 2 以便测试分页（原值 20）

export default function RecordsPage() {
  const router = useRouter();
  const { records, visions } = useApp();
  const [selectedVisionId, setSelectedVisionId] = useState<string | null>(null);
  const [displayedCount, setDisplayedCount] = useState(PAGE_SIZE);

  // Sort records by date (newest first)
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => b.createdAt - a.createdAt);
  }, [records]);

  // Filter records by vision
  const filteredRecords = useMemo(() => {
    if (!selectedVisionId) return sortedRecords;
    return sortedRecords.filter(r => r.visions.includes(selectedVisionId));
  }, [sortedRecords, selectedVisionId]);

  // Get displayed records (pagination)
  const displayedRecords = useMemo(() => {
    return filteredRecords.slice(0, displayedCount);
  }, [filteredRecords, displayedCount]);

  // Check if there are more records to load
  const hasMoreRecords = displayedCount < filteredRecords.length;

  // Load more records
  const loadMore = () => {
    if (hasMoreRecords) {
      setDisplayedCount(prev => prev + PAGE_SIZE);
    }
  };

  // Reset pagination when filter changes
  const handleVisionFilter = (visionId: string | null) => {
    setSelectedVisionId(visionId);
    setDisplayedCount(PAGE_SIZE);
  };

  // Group records by date
  const groupedRecords = useMemo(() => {
    const groups: { date: string; dateObj: Date; records: EnergyRecord[]; showFullDate: boolean }[] = [];
    let currentDateKey = '';

    displayedRecords.forEach(record => {
      const dateInfo = formatDate(record.createdAt);
      const dateKey = dateInfo.label;
      
      if (dateKey !== currentDateKey) {
        currentDateKey = dateKey;
        groups.push({ 
          date: dateKey, 
          dateObj: new Date(record.createdAt),
          records: [],
          showFullDate: dateInfo.showFull 
        });
      }
      groups[groups.length - 1].records.push(record);
    });

    return groups;
  }, [displayedRecords]);

  const renderRecord = (record: EnergyRecord) => {
    const dateInfo = formatDate(record.createdAt);
    
    return (
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
            <View style={styles.recordMain}>
              <View style={styles.recordHeader}>
                <Text style={styles.recordState}>
                  {getStateEmoji(record.type, record.bodyStateId)} {getStateLabel(record.type, record.bodyStateId, record.customBodyState)}
                </Text>
              <View style={styles.recordTimeContainer}>
                <Text style={styles.recordDate}>{dateInfo.label}</Text>
                <Text style={styles.recordTime}>{formatTime(record.createdAt)}</Text>
              </View>
            </View>
            {record.visions.length > 0 && (
              <View style={styles.recordVisions}>
                {record.visions.slice(0, 2).map(visionId => (
                  <View key={visionId} style={styles.recordVisionTag}>
                    <Text style={styles.recordVisionText}>{getVisionEmoji(visionId, visions)} {getVisionLabel(visionId, visions)}</Text>
                  </View>
                ))}
                {record.visions.length > 2 && (
                  <Text style={styles.recordVisionMore}>+{record.visions.length - 2}</Text>
                )}
              </View>
            )}
          </View>
          <View style={styles.recordRight}>
            <Text style={[
              styles.recordScore,
              { color: record.score > 0 ? colors.flow.primary : colors.drain.primary }
            ]}>
              {record.score > 0 ? '+' : ''}{record.score}
            </Text>
          </View>
        </View>
      </Card>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!hasMoreRecords) {
      return (
        <View style={styles.footer}>
          <Text style={styles.footerText}>— 没有更多记录了 —</Text>
        </View>
      );
    }
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.flow.primary} />
      </View>
    );
  };

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
        <Text style={styles.headerTitle}>记录列表</Text>
        <TouchableOpacity 
          style={styles.debugButton}
          onPress={() => console.log(`[Debug] Total: ${filteredRecords.length}, Displayed: ${displayedCount}, HasMore: ${hasMoreRecords}`)}
        >
          <Text style={styles.debugButtonText}>📊</Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <View style={styles.contentArea}>
        {/* Vision Filter */}
        <View style={styles.filterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
          >
            <TouchableOpacity
              style={[
                styles.filterPill,
                !selectedVisionId && styles.filterPillActive,
              ]}
              onPress={() => handleVisionFilter(null)}
            >
              <Text style={[
                styles.filterPillText,
                !selectedVisionId && styles.filterPillTextActive,
              ]}>
                全部
              </Text>
            </TouchableOpacity>
            
            {visions.map(vision => (
              <TouchableOpacity
                key={vision.id}
                style={[
                  styles.filterPill,
                  selectedVisionId === vision.id && styles.filterPillActive,
                ]}
                onPress={() => handleVisionFilter(vision.id)}
              >
                <Text style={[
                  styles.filterPillText,
                  selectedVisionId === vision.id && styles.filterPillTextActive,
                ]}>
                  {vision.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Records List */}
        {filteredRecords.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={styles.emptyText}>暂无记录</Text>
            {selectedVisionId && (
              <Text style={styles.emptySubtext}>该愿景下还没有记录</Text>
            )}
          </View>
        ) : (
        <FlatList
          data={groupedRecords}
          keyExtractor={(item) => item.date}
          renderItem={({ item: group }) => (
            <View style={styles.dateGroup}>
              <View style={styles.dateHeader}>
                <View style={styles.dateLine} />
                <Text style={styles.dateText}>{group.date}</Text>
                <View style={styles.dateLine} />
              </View>
              {group.records.map(renderRecord)}
            </View>
          )}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📝</Text>
              <Text style={styles.emptyText}>暂无记录</Text>
              {selectedVisionId && (
                <Text style={styles.emptySubtext}>该愿景下还没有记录</Text>
              )}
            </View>
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
        )}
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
    fontSize: 16,
    fontWeight: '600',
    color: colors.white.primary,
  },
headerPlaceholder: {
    width: 36,
    height: 36,
  },
  debugButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  debugButtonText: {
    fontSize: 16,
  },
  contentArea: {
    flex: 1,
  },
  filterContainer: {
    paddingVertical: 8,
    marginBottom: 16,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterPillActive: {
    backgroundColor: 'rgba(0, 212, 212, 0.15)',
    borderColor: 'rgba(0, 212, 212, 0.4)',
  },
  filterPillText: {
    fontSize: 12,
    color: colors.white.muted,
  },
  filterPillTextActive: {
    color: colors.flow.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dateText: {
    fontSize: 12,
    color: colors.white.muted,
    fontWeight: '500',
  },
  recordCard: {
    marginBottom: 8,
  },
  recordContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  recordDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  recordMain: {
    flex: 1,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  recordState: {
    fontSize: 13,
    color: colors.white.secondary,
  },
  recordTimeContainer: {
    alignItems: 'flex-end',
  },
  recordDate: {
    fontSize: 10,
    color: colors.white.muted,
  },
  recordTime: {
    fontSize: 10,
    color: colors.white.subtle,
  },
  recordVisions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recordVisionTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 212, 212, 0.1)',
  },
  recordVisionText: {
    fontSize: 10,
    color: colors.flow.primary,
  },
  recordVisionMore: {
    fontSize: 10,
    color: colors.white.muted,
  },
  recordRight: {
    alignItems: 'flex-end',
  },
  recordScore: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.white.muted,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.white.secondary,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.white.muted,
    marginTop: 8,
  },
});
