import { Tabs, type BottomTabBarButtonProps } from 'expo-router/js-tabs';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabIcon } from '@/components/layout/TabIcon';
import { colors, fonts } from '@/theme';

// Descobrir and Notificações are visible but do nothing in v1.
function InactiveTabButton({ style, children }: BottomTabBarButtonProps) {
  return (
    <View style={[style, { opacity: 0.4 }]} accessibilityState={{ disabled: true }} accessibilityHint="Em breve">
      {children}
    </View>
  );
}

export default function TabsLayout() {
  // Space taken by Android's own buttons / gesture bar at the bottom.
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.text2,
        tabBarLabelStyle: { fontFamily: fonts.regular, fontSize: 12 },
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.surface2,
          height: 72 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom,
        },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: 'Home', tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} /> }}
      />
      <Tabs.Screen
        name="descobrir"
        options={{
          title: 'Descobrir',
          tabBarIcon: () => <TabIcon name="discover" focused={false} />,
          tabBarButton: InactiveTabButton,
        }}
      />
      <Tabs.Screen
        name="notificacoes"
        options={{
          title: 'Notificações',
          tabBarIcon: () => <TabIcon name="notifications" focused={false} />,
          tabBarButton: InactiveTabButton,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Perfil', tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} /> }}
      />
    </Tabs>
  );
}
