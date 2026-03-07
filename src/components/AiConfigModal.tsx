import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Eye, EyeOff, Check, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Modal } from './Modal';
import { Button } from './Button';
import { colors, borderRadius, spacing } from '@/utils/theme';
import { AiConfig } from '@/types';

const DEFAULT_API_URL = 'https://coding.dashscope.aliyuncs.com/v1';
const DEFAULT_MODEL = 'qwen3.5-plus';

interface AiConfigModalProps {
  visible: boolean;
  onClose: () => void;
  config: AiConfig | null;
  onSave: (config: AiConfig) => Promise<void>;
  onClear: () => Promise<void>;
}

export function AiConfigModal({ visible, onClose, config, onSave, onClear }: AiConfigModalProps) {
  const [apiUrl, setApiUrl] = useState(config?.apiUrl || DEFAULT_API_URL);
  const [apiKey, setApiKey] = useState(config?.apiKey || '');
  const [model, setModel] = useState(config?.model || DEFAULT_MODEL);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (visible) {
      setApiUrl(config?.apiUrl || DEFAULT_API_URL);
      setApiKey(config?.apiKey || '');
      setModel(config?.model || DEFAULT_MODEL);
      setShowApiKey(false);
    }
  }, [visible, config]);

  const handleSave = async () => {
    if (!apiUrl.trim() || !apiKey.trim() || !model.trim()) {
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSaving(true);
    
    try {
      await onSave({ apiUrl: apiUrl.trim(), apiKey: apiKey.trim(), model: model.trim() });
      onClose();
    } catch (error) {
      console.error('Failed to save AI config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsDeleting(true);
    
    try {
      await onClear();
      setApiUrl(DEFAULT_API_URL);
      setApiKey('');
      setModel(DEFAULT_MODEL);
    } catch (error) {
      console.error('Failed to clear AI config:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const isValid = apiUrl.trim() && apiKey.trim() && model.trim();

  return (
    <Modal visible={visible} onClose={onClose} showClose={true}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>AI 大模型配置</Text>
          <Text style={styles.subtitle}>
            配置你的 AI 服务以启用深度洞察分析
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>API 地址</Text>
            <TextInput
              style={styles.input}
              value={apiUrl}
              onChangeText={setApiUrl}
              placeholder="https://api.openai.com/v1"
              placeholderTextColor={colors.white.subtle}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <Text style={styles.hint}>支持 OpenAI 格式的 API 端点</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>API Key</Text>
            <View style={styles.apiKeyContainer}>
              <TextInput
                style={[styles.input, styles.apiKeyInput]}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="sk-..."
                placeholderTextColor={colors.white.subtle}
                secureTextEntry={!showApiKey}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff size={18} color={colors.white.muted} />
                ) : (
                  <Eye size={18} color={colors.white.muted} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>模型名称</Text>
            <TextInput
              style={styles.input}
              value={model}
              onChangeText={setModel}
              placeholder="gpt-4o-mini"
              placeholderTextColor={colors.white.subtle}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.actions}>
            <Button
              title={isSaving ? '保存中...' : '保存配置'}
              onPress={handleSave}
              variant="flow"
              size="lg"
              disabled={!isValid || isSaving}
              loading={isSaving}
            />
            
            {config && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleClear}
                disabled={isDeleting}
              >
                <Trash2 size={16} color={colors.danger} />
                <Text style={styles.deleteText}>
                  {isDeleting ? '清除中...' : '清除配置'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {config && (
            <View style={styles.status}>
              <Check size={14} color={colors.success} />
              <Text style={styles.statusText}>已配置</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 13,
    color: colors.white.muted,
    marginBottom: spacing['2xl'],
    lineHeight: 20,
  },
  field: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.white.secondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: colors.white.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: colors.white.primary,
  },
  apiKeyContainer: {
    position: 'relative',
  },
  apiKeyInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.md,
    top: '50%',
    transform: [{ translateY: -12 }],
    padding: spacing.xs,
  },
  hint: {
    fontSize: 11,
    color: colors.white.subtle,
    marginTop: spacing.xs,
  },
  actions: {
    marginTop: spacing['2xl'],
    gap: spacing.lg,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  deleteText: {
    fontSize: 13,
    color: colors.danger,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(0, 180, 100, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 100, 0.2)',
  },
  statusText: {
    fontSize: 13,
    color: colors.success,
  },
});