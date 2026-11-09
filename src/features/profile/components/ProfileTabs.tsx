import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Icon } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

export type ProfileTab = 'videos' | 'projects' | 'stats';

const TABS: { key: ProfileTab; label: string }[] = [
  { key: 'videos', label: 'Vídeos' },
  { key: 'projects', label: 'Projetos' },
  { key: 'stats', label: 'Estatísticas' },
];

type Props = {
  tab: ProfileTab;
  onChange: (tab: ProfileTab) => void;
  // "+" (new post) only on your own profile.
  onAdd?: () => void;
};

// Row under the profile header: "+" and the Vídeos / Projetos /
// Estatísticas pills (active = orange).
export function ProfileTabs({ tab, onChange, onAdd }: Props) {
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {onAdd ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Nova publicação"
          onPress={onAdd}
          style={({ pressed }) => [styles.add, pressed && styles.addPressed]}
        >
          <Icon name="plus" size={22} color={colors.white} />
        </Pressable>
      ) : null}
      {TABS.map((item) => {
        const active = item.key === tab;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(item.key)}
            style={[styles.tab, active && styles.active]}
          >
            <AppText variant="bodyStrong" color={active ? 'onPrimary' : 'text'} numberOfLines={1}>
              {item.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.xl },
  add: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.text3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  addPressed: { backgroundColor: colors.text2 },
  tab: { flex: 1, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  active: { backgroundColor: colors.primary },
});
