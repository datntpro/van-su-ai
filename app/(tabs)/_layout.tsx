import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { colors } from '@/src/theme/colors';

function TabIcon({ emoji, active }: { emoji: string; active: boolean }) {
  return <Text style={{ fontSize: 20, opacity: active ? 1 : 0.7 }}>{emoji}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hôm nay',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📅" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="tu-vi"
        options={{
          title: 'Tử vi',
          tabBarIcon: ({ focused }) => <TabIcon emoji="✨" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="tuong-so"
        options={{
          title: 'Tướng số',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🪞" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="pro"
        options={{
          title: 'Pro',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👑" active={focused} />,
        }}
      />
    </Tabs>
  );
}
