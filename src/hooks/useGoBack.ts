/**
 * 带触觉反馈的返回导航 Hook
 */
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';

export const useGoBack = () => {
  const router = useRouter();
  
  const goBack = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);
  
  return goBack;
};
