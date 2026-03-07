// Vision Page - 愿景设定
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, X, Check, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/store/AppContext';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors, spacing, borderRadius } from '@/utils/theme';
import { PRESET_VISIONS, Vision } from '@/types';

export default function VisionPage() {
  const router = useRouter();
  const { visions, activeCommitments, addVision, updateVision, deleteVision, hasOnboarded, completeOnboarding } = useApp();
  
  const [showAdd, setShowAdd] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customEmoji, setCustomEmoji] = useState('🎯');
  const [detailInput, setDetailInput] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedDescId, setExpandedDescId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDetail, setEditingDetail] = useState('');
  const [editingDescId, setEditingDescId] = useState<string | null>(null);
  const [editingDescText, setEditingDescText] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Helper function to show alert (works on web too)
  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      setTimeout(() => {
        alert(`${title}\n\n${message}`);
      }, 100);
    } else {
      Alert.alert(title, message);
    }
  };
  
  // 核心规则：愿景数量为 0 时不能退出
  const canExit = visions.length > 0;
  
  const handleAddVision = async () => {
    setError(null);
    
    // 检查愿景数量限制
    if (visions.length >= 3) {
      setError('最多只能添加 3 个愿景');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    if (isCustom) {
      // 自定义愿景验证
      if (!customTitle || !customLabel || !customDesc || !detailInput) {
        setError('请填写所有必填项');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      
      // 验证长度限制
      const titleLength = customTitle.replace(/[^\u4e00-\u9fa5]/g, '').length;
      const labelLength = customLabel.replace(/[^\u4e00-\u9fa5]/g, '').length;
      const descLength = customDesc.replace(/[^\u4e00-\u9fa5]/g, '').length;
      const detailLength = detailInput.length;
      
      if (titleLength > 6) {
        setError('愿景名称最多 6 个汉字');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      
      if (labelLength > 4) {
        setError('标签最多 4 个汉字');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      
      if (descLength > 120) {
        setError('概念描述最多 120 个汉字');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      
      if (detailLength > 2000) {
        setError('详细描述最多 2000 个字');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      await addVision({
        title: customTitle,
        emoji: customEmoji,
        label: customLabel,
        desc: customDesc,
        detail: detailInput,
        energyScore: 0,
      });
      
      setIsCustom(false);
      setCustomTitle('');
      setCustomLabel('');
      setCustomDesc('');
      setCustomEmoji('🎯');
    } else {
      // 预设愿景
      if (!selectedPreset) {
        setError('请选择一个愿景');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      const preset = PRESET_VISIONS.find(p => p.id === selectedPreset);
      if (!preset || visions.find(v => v.id === preset.id)) return;
      
      // 验证必填项
      if (!detailInput) {
        setError('请填写详细描述');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      
      // 验证长度限制
      const detailLength = detailInput.length;
      if (detailLength > 2000) {
        setError('详细描述最多 2000 个字');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      await addVision({
        title: preset.title,
        emoji: preset.emoji,
        label: preset.label,
        desc: preset.desc,
        detail: detailInput,
        energyScore: 0,
      });
    }
    
    setShowAdd(false);
    setSelectedPreset(null);
    setDetailInput('');
    setError(null);
  };
  
  const handleRemove = async (id: string) => {
    const visionToDelete = visions.find(v => v.id === id);
    if (!visionToDelete) return;
    
    // Check for active commitments linked to this vision
    const linkedCommitments = activeCommitments.filter(
      (c) => c.visionId === id && c.status === 'active'
    );
    
    let confirmed = false;
    
    if (linkedCommitments.length > 0) {
      // Show warning about cascading delete
      confirmed = await new Promise<boolean>((resolve) => {
        if (Platform.OS === 'web') {
          const result = confirm(
            `确定要删除 "${visionToDelete.title}" 吗？\n\n⚠️ 此愿景有 ${linkedCommitments.length} 个活跃承诺，删除后将一并删除：\n${linkedCommitments.map((c) => `• ${c.content}`).join('\n')}`
          );
          resolve(result);
        } else {
          Alert.alert(
            '确认删除',
            `确定要删除 "${visionToDelete.title}" 吗？\n\n⚠️ 此愿景有 ${linkedCommitments.length} 个活跃承诺，删除后将一并删除：\n${linkedCommitments.map((c) => `• ${c.content}`).join('\n')}`,
            [
              { text: '取消', style: 'cancel', onPress: () => resolve(false) },
              { text: '删除', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        }
      });
    } else {
      // Normal confirmation without commitments warning
      confirmed = await new Promise<boolean>((resolve) => {
        if (Platform.OS === 'web') {
          const result = confirm(
            `确定要删除 "${visionToDelete.title}" 吗？`
          );
          resolve(result);
        } else {
          Alert.alert(
            '确认删除',
            `确定要删除 "${visionToDelete.title}" 吗？`,
            [
              { text: '取消', style: 'cancel', onPress: () => resolve(false) },
              { text: '删除', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        }
      });
    }
    
    if (!confirmed) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await deleteVision(id);
    if (expandedId === id) setExpandedId(null);
  };
  
  const handleSaveDetail = async (id: string) => {
    await updateVision(id, { detail: editingDetail });
    setEditingId(null);
  };
  
  const handleSaveDesc = async (id: string) => {
    // 验证长度限制
    const descLength = editingDescText.replace(/[^\u4e00-\u9fa5]/g, '').length;
    if (descLength > 120) {
      setError('概念描述最多 120 个汉字');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    await updateVision(id, { desc: editingDescText });
    setEditingDescId(null);
    setError(null);
  };
  
  const availablePresets = PRESET_VISIONS.filter(
    p => !visions.find(v => v.id === p.id)
  );
  
  const handleBack = () => {
    if (!canExit) {
      showAlert(
        '需要设置愿景',
        '请至少保留 1 个愿景才能离开，愿景是你能量记录的方向。'
      );
      return;
    }
    router.back();
  };
  
  const handleSave = async () => {
    if (!canExit) {
      showAlert(
        '需要设置愿景',
        '请至少保留 1 个愿景，愿景是你能量记录的方向。'
      );
      return;
    }
    
    if (!hasOnboarded) {
      // Complete onboarding and go to home
      await completeOnboarding();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/');
    } else {
      // Just go back
      router.back();
    }
  };
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBack}
        >
          <ArrowLeft size={18} color={colors.white.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>愿景</Text>
          <Text style={styles.headerSubtitle}>明确愿景，驱动人生</Text>
        </View>
        
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>{!hasOnboarded ? '完成' : '保存'}</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Intro */}
        <Card style={styles.introCard} variant="flow">
          <Text style={styles.introText}>
            {!hasOnboarded 
              ? '愿景是你能量流动的方向。请至少选择 1 个愿景（最多 3 个），这些将作为你能量记录的锚点。设置完成后才能继续。'
              : '愿景是你能量流动的方向。越具体的愿景，越能帮助你在日常中做出清醒的选择，最多只能设定 3 个愿景。'
            }
          </Text>
        </Card>
        
        {/* Active Visions */}
        <Text style={styles.sectionLabel}>
          {!hasOnboarded ? '请选择' : '已设定'} {visions.length} 个愿景
          {!hasOnboarded && visions.length === 0 ? '（至少 1 个）' : ''}
        </Text>
        
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
                <View style={styles.visionTextContainer}>
                  <Text style={styles.visionTitle}>{vision.title}</Text>
                  <View style={styles.visionMeta}>
                    <Text style={styles.visionLabel}>{vision.label}</Text>
                    <TouchableOpacity
                      onPress={() => setExpandedDescId(expandedDescId === vision.id ? null : vision.id)}
                      activeOpacity={0.7}
                      style={styles.visionDescTouch}
                    >
                      <Text
                        style={[
                          styles.visionDesc,
                          expandedDescId === vision.id && styles.visionDescExpanded,
                        ]}
                        numberOfLines={expandedDescId === vision.id ? 0 : 1}
                        ellipsizeMode="tail"
                      >
                        {vision.desc}
                      </Text>
                    </TouchableOpacity>
                  </View>
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
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>概念描述</Text>
                  {editingDescId === vision.id ? (
                    <View>
                      <TextInput
                        style={styles.detailInput}
                        value={editingDescText}
                        onChangeText={setEditingDescText}
                        placeholder="描述这个愿景的核心概念..."
                        placeholderTextColor={colors.white.muted}
                        multiline
                        numberOfLines={3}
                      />
                      <Button
                        title="完成"
                        onPress={() => handleSaveDesc(vision.id)}
                        size="sm"
                        variant="flow"
                      />
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.detailDisplay}
                      onPress={() => {
                        setEditingDescId(vision.id);
                        setEditingDescText(vision.desc || '');
                      }}
                    >
                      <Text style={[
                        styles.detailSectionText,
                        !vision.desc && styles.detailPlaceholder,
                      ]}>
                        {vision.desc || '点击添加概念描述...'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                <View style={styles.detailSection}>
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
              </View>
            )}
          </Card>
        ))}
        
        {/* Add Button */}
        {visions.length >= 3 ? (
          <View style={styles.maxVisionHint}>
            <Text style={styles.maxVisionText}>已达到最大愿景数量（3 个）</Text>
          </View>
        ) : !showAdd ? (
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
              <Text style={styles.addFormTitle}>添加愿景</Text>
              <TouchableOpacity onPress={() => {
                setShowAdd(false);
                setSelectedPreset(null);
                setIsCustom(false);
                setCustomTitle('');
                setCustomLabel('');
                setCustomDesc('');
                setCustomEmoji('🎯');
                setDetailInput('');
                setError(null);
              }}>
                <X size={16} color={colors.white.muted} />
              </TouchableOpacity>
            </View>
            
            {/* 错误提示 */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            
            {/* 选择模式 */}
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  !isCustom && styles.modeButtonActive,
                ]}
                onPress={() => setIsCustom(false)}
              >
                <Text style={[
                  styles.modeButtonText,
                  !isCustom && styles.modeButtonTextActive,
                ]}>选择预设</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  isCustom && styles.modeButtonActive,
                ]}
                onPress={() => setIsCustom(true)}
              >
                <Text style={[
                  styles.modeButtonText,
                  isCustom && styles.modeButtonTextActive,
                ]}>自定义</Text>
              </TouchableOpacity>
            </View>
            
            {isCustom ? (
              /* 自定义表单 */
              <View>
                <Text style={styles.inputLabel}>图标</Text>
                <TextInput
                  style={styles.emojiInput}
                  value={customEmoji}
                  onChangeText={setCustomEmoji}
                  placeholder="🎯"
                  placeholderTextColor={colors.white.muted}
                  maxLength={2}
                />
                
                <Text style={styles.inputLabel}>愿景名称 *</Text>
                <TextInput
                  style={styles.textInput}
                  value={customTitle}
                  onChangeText={setCustomTitle}
                  placeholder="必填，最多 6 个汉字，例如：身心健康"
                  placeholderTextColor={colors.white.muted}
                />
                
                <Text style={styles.inputLabel}>标签（简短分类） *</Text>
                <TextInput
                  style={styles.textInput}
                  value={customLabel}
                  onChangeText={setCustomLabel}
                  placeholder="必填，最多 4 个汉字，例如：健康、财富"
                  placeholderTextColor={colors.white.muted}
                />
                
                <Text style={styles.inputLabel}>概念描述 *</Text>
                <TextInput
                  style={styles.textArea}
                  value={customDesc}
                  onChangeText={setCustomDesc}
                  placeholder="必填，最多 120 个汉字，用一句话描述这个愿景的核心..."
                  placeholderTextColor={colors.white.muted}
                  multiline
                  numberOfLines={3}
                />
                
                <Text style={styles.detailInputLabel}>详细描述 *</Text>
                <TextInput
                  style={styles.detailInput}
                  value={detailInput}
                  onChangeText={setDetailInput}
                  placeholder="必填，最多 2000 字，例如：我希望在 40 岁前拥有稳定的被动收入..."
                  placeholderTextColor={colors.white.muted}
                  multiline
                  numberOfLines={4}
                />
                
                <Button
                  title="确认添加"
                  onPress={handleAddVision}
                  variant="flow"
                  size="lg"
                  disabled={visions.length >= 3 || !customTitle || !customLabel || !customDesc || !detailInput}
                />
              </View>
            ) : (
              /* 预设选择 */
              <View>
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
                    <Text style={styles.detailInputLabel}>详细描述 *</Text>
                    <TextInput
                      style={styles.detailInput}
                      value={detailInput}
                      onChangeText={setDetailInput}
                      placeholder="必填，最多 2000 字，例如：我希望在 40 岁前拥有稳定的被动收入..."
                      placeholderTextColor={colors.white.muted}
                      multiline
                      numberOfLines={4}
                    />
                    
                    <Button
                      title="确认添加"
                      onPress={handleAddVision}
                      variant="flow"
                      size="lg"
                      disabled={visions.length >= 3 || !detailInput}
                    />
                  </>
                )}
              </View>
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
    flex: 1,
    minWidth: 0,
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
  visionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white.primary,
  },
  visionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
    flex: 1,
  },
  visionTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  visionLabel: {
    fontSize: 11,
    color: colors.flow.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(0, 180, 180, 0.15)',
    flexShrink: 0,
  },
  visionDesc: {
    fontSize: 11,
    color: colors.white.muted,
    flexShrink: 1,
  },
  visionDescTouch: {
    flexShrink: 1,
  },
  visionDescExpanded: {
    fontSize: 12,
    color: colors.white.secondary,
    lineHeight: 20,
    marginTop: 4,
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
  detailSection: {
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.white.muted,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailSectionText: {
    fontSize: 13,
    color: colors.white.secondary,
    lineHeight: 22,
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
  maxVisionHint: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: borderRadius['3xl'],
    backgroundColor: 'rgba(0, 180, 180, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 200, 0.3)',
    alignItems: 'center',
  },
  maxVisionText: {
    fontSize: 13,
    color: colors.flow.primary,
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
  errorContainer: {
    padding: 12,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 60, 60, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 60, 60, 0.3)',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    color: 'rgba(255, 100, 100, 0.9)',
    textAlign: 'center',
  },
  visionCountHint: {
    padding: 8,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(0, 180, 180, 0.1)',
    marginBottom: 12,
    alignItems: 'center',
  },
  visionCountText: {
    fontSize: 11,
    color: colors.flow.primary,
  },
  modeToggle: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modeButtonActive: {
    backgroundColor: 'rgba(0, 180, 180, 0.2)',
    borderColor: 'rgba(0, 200, 200, 0.5)',
  },
  modeButtonText: {
    fontSize: 13,
    color: colors.white.muted,
  },
  modeButtonTextActive: {
    color: colors.flow.primary,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 11,
    color: colors.white.muted,
    marginBottom: 6,
    marginTop: 12,
  },
  textInput: {
    padding: 12,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: colors.white.primary,
    fontSize: 14,
  },
  textArea: {
    padding: 12,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: colors.white.primary,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  emojiInput: {
    padding: 12,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: colors.white.primary,
    fontSize: 24,
    textAlign: 'center',
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