// Vision Page - 愿景设定
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, X, Check, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/store/AppContext';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors, typography, spacing, borderRadius } from '@/utils/theme';
import { PRESET_VISIONS, Vision } from '@/types';

export default function VisionPage() {
  const router = useRouter();
  const { visions, addVision, updateVision, deleteVision } = useApp();
  
  const [showAdd, setShowAdd] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [detailInput, setDetailInput] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDetail, setEditingDetail] = useState('');
  
  const handleAddVision = async () => {
    if (!selectedPreset) return;
    const preset = PRESET_VISIONS.find(p => p.id === selectedPreset);
    if (!preset || visions.find(v => v.id === preset.id)) return;
    
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    await addVision({
      emoji: preset.emoji,
      label: preset.label,
      desc: preset.desc,
      detail: detailInput || undefined,
    });
    
    setShowAdd(false);
    setSelectedPreset(null);
    setDetailInput('');
  };
  
  const handleRemove = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await deleteVision(id);
    if (expandedId === id) setExpandedId(null);
  };
  
  const handleSaveDetail = async (id: string) => {
    await updateVision(id, { detail: editingDetail });
    setEditingId(null);
  };
  
  const availablePresets = PRESET_VISIONS.filter(
    p => !visions.find(v => v.id === p.id)
  );
  
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
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>愿景设定</Text>
          <Text style={styles.headerSubtitle}>明确愿景，驱动觉察</Text>
        </View>
        
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => router.back()}
        >
          <Text style={styles.saveButtonText}>保存</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Intro */}
        <Card style={styles.introCard} variant="flow">
          <Text style={styles.introText}>
            愿景是你能量流动的方向。越具体的愿景，越能帮助你在日常中做出清醒的选择。
          </Text>
        </Card>
        
        {/* Active Visions */}
        <Text style={styles.sectionLabel}>已设定 {visions.length} 个愿景</Text>
        
        {visions.map((vision) => (
          <Card key={vision.id} style={styles.visionCard}>
            <TouchableOpacity
              style={styles.visionHeader}
              onPress={() => setExpandedId(expandedId === vision.id ? null : vision.id)}
            >
              <View style={styles.visionInfo}>
                <View style={styles.visionEmojiContainer}>
                  <Text style={styles.visionEmoji}>{vision.emoji}</Text>
                </View>
                <View>
                  <Text style={styles.visionLabel}>{vision.label}</Text>
                  <Text style={styles.visionDesc}>{vision.desc}</Text>
                </View>
              </View>
              
              <View style={styles.visionActions}>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemove(vision.id)}
                >
                  <X size={12} color="rgba(255, 100, 100, 0.7)" />
                </TouchableOpacity>
                <ChevronRight
                  size={16}
                  color={colors.white.subtle}
                  style={{
                    transform: [{ rotate: expandedId === vision.id ? '90deg' : '0deg' }],
                  }}
                />
              </View>
            </TouchableOpacity>
            
            {expandedId === vision.id && (
              <View style={styles.visionDetail}>
                <Text style={styles.detailLabel}>愿景详述（越具体越好）</Text>
                
                {editingId === vision.id ? (
                  <View>
                    <TextInput
                      style={styles.detailInput}
                      value={editingDetail}
                      onChangeText={setEditingDetail}
                      placeholder="描述你的愿景..."
                      placeholderTextColor={colors.white.muted}
                      multiline
                      numberOfLines={4}
                    />
                    <Button
                      title="完成"
                      onPress={() => handleSaveDetail(vision.id)}
                      size="sm"
                      variant="flow"
                    />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.detailDisplay}
                    onPress={() => {
                      setEditingId(vision.id);
                      setEditingDetail(vision.detail || '');
                    }}
                  >
                    <Text style={[
                      styles.detailText,
                      !vision.detail && styles.detailPlaceholder,
                    ]}>
                      {vision.detail || '点击添加愿景详述，让它更具体、更有力量...'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </Card>
        ))}
        
        {/* Add Button */}
        {!showAdd ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAdd(true)}
          >
            <Plus size={18} color={colors.white.muted} />
            <Text style={styles.addButtonText}>添加新愿景</Text>
          </TouchableOpacity>
        ) : (
          <Card style={styles.addForm}>
            <View style={styles.addFormHeader}>
              <Text style={styles.addFormTitle}>选择愿景标签</Text>
              <TouchableOpacity onPress={() => {
                setShowAdd(false);
                setSelectedPreset(null);
                setDetailInput('');
              }}>
                <X size={16} color={colors.white.muted} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.presetGrid}>
              {availablePresets.map((preset) => {
                const isSelected = selectedPreset === preset.id;
                return (
                  <TouchableOpacity
                    key={preset.id}
                    style={[
                      styles.presetCard,
                      isSelected && styles.presetCardSelected,
                    ]}
                    onPress={() => setSelectedPreset(isSelected ? null : preset.id)}
                  >
                    <Text style={styles.presetEmoji}>{preset.emoji}</Text>
                    <Text style={[
                      styles.presetLabel,
                      isSelected && styles.presetLabelSelected,
                    ]}>
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            {selectedPreset && (
              <>
                <Text style={styles.detailInputLabel}>详细描述你的愿景（可选，越具体越好）</Text>
                <TextInput
                  style={styles.detailInput}
                  value={detailInput}
                  onChangeText={setDetailInput}
                  placeholder="例如：我希望在40岁前拥有稳定的被动收入..."
                  placeholderTextColor={colors.white.muted}
                  multiline
                  numberOfLines={4}
                />
                
                <Button
                  title="确认添加"
                  onPress={handleAddVision}
                  variant="flow"
                  size="lg"
                />
              </>
            )}
          </Card>
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
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white.primary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.white.muted,
    marginTop: 2,
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(0, 180, 180, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 200, 0.3)',
  },
  saveButtonText: {
    fontSize: 12,
    color: colors.flow.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  introCard: {
    marginBottom: 20,
  },
  introText: {
    fontSize: 13,
    color: 'rgba(0, 220, 200, 0.8)',
    lineHeight: 22,
  },
  sectionLabel: {
    fontSize: 12,
    color: colors.white.muted,
    marginBottom: 12,
  },
  visionCard: {
    marginBottom: 12,
  },
  visionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  visionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  visionEmojiContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(0, 180, 180, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 200, 0.2)',
  },
  visionEmoji: {
    fontSize: 20,
  },
  visionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white.primary,
  },
  visionDesc: {
    fontSize: 11,
    color: colors.white.muted,
    marginTop: 2,
  },
  visionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  removeButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255, 60, 60, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 60, 60, 0.2)',
  },
  visionDetail: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  detailLabel: {
    fontSize: 11,
    color: colors.white.muted,
    marginBottom: 6,
  },
  detailInput: {
    padding: 12,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: colors.white.primary,
    fontSize: 13,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
    lineHeight: 22,
  },
  detailDisplay: {
    padding: 12,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailText: {
    fontSize: 13,
    color: colors.white.secondary,
    lineHeight: 22,
  },
  detailPlaceholder: {
    color: colors.white.subtle,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: borderRadius['3xl'],
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  addButtonText: {
    fontSize: 14,
    color: colors.white.muted,
  },
  addForm: {
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 200, 0.2)',
  },
  addFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addFormTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white.secondary,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  presetCard: {
    width: '18%',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  presetCardSelected: {
    backgroundColor: 'rgba(0, 180, 180, 0.2)',
    borderColor: 'rgba(0, 200, 200, 0.5)',
  },
  presetEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  presetLabel: {
    fontSize: 9,
    color: colors.white.muted,
  },
  presetLabelSelected: {
    color: colors.flow.primary,
  },
  detailInputLabel: {
    fontSize: 11,
    color: colors.white.muted,
    marginBottom: 6,
  },
});