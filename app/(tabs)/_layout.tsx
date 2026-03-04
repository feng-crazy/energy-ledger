import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Home, BarChart2, Zap, Brain } from 'lucide-react-native';
import { colors } from '@/utils/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.flow.primary,
        tabBarInactiveTintColor: colors.white.muted,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: '统计',
          tabBarIcon: ({ color, size }) => (
            <BarChart2 size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="contract"
        options={{
          title: '契约',
          tabBarIcon: ({ color, size }) => (
            <Zap size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: '洞察',
          tabBarIcon: ({ color, size }) => (
            <Brain size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.background.primary,
    borderTopColor: colors.white.border,
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: 24,
    height: 72,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
  },
});