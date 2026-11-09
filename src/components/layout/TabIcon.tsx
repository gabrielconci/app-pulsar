import { StyleSheet, View } from 'react-native';
import { Icon, type IconName } from '@/components/ui';
import { colors, radius } from '@/theme';

// Tab bar icon: the active tab sits in an orange circle, as in Figma.
export function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <View style={[styles.circle, focused && styles.active]}>
      <Icon name={name} size={22} color={focused ? colors.white : colors.text} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { width: 40, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  active: { backgroundColor: colors.primary },
});
