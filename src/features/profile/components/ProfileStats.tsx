import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { AppText } from '@/components/ui';
import { colors, fonts, spacing } from '@/theme';
import { formatCount } from '@/utils/format';
import type { ProfileStats as Stats } from '../api';

type Props = { stats: Stats | null | undefined; loading: boolean };

// "Estatísticas" tab (Figma): Público, Aclamações, Conexões and Brasil in
// grey circles, then "MEMBRO DESDE <ano>". Country is always Brasil in v1.
export function ProfileStats({ stats, loading }: Props) {
  if (loading) return <ActivityIndicator color={colors.primary} style={styles.loading} />;
  if (!stats) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        <Stat label="Público" value={formatCount(stats.audience)} />
        <Stat label="Aclamações" value={formatCount(stats.claps)} />
        <Stat label="Conexões" value={formatCount(stats.connections)} />
        <Stat label="Brasil" value={<BrazilIcon />} />
      </View>
      <AppText variant="caption" color="text2" align="center" style={styles.since}>
        MEMBRO DESDE {new Date(stats.memberSince).getFullYear()}
      </AppText>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={typeof value === 'string' ? `${label}: ${value}` : label}>
      <View style={styles.circle}>
        {typeof value === 'string' ? <AppText style={styles.value}>{value}</AppText> : value}
      </View>
      <AppText variant="bodyStrong" style={styles.label}>
        {label}
      </AppText>
    </View>
  );
}

// Brazilian flag drawn in one color, as in the Figma circle.
function BrazilIcon() {
  return (
    <Svg width={58} height={40} viewBox="0 0 58 40">
      <Path d="M29 2L56 20L29 38L2 20Z" fill={colors.text} />
      <Circle cx="29" cy="20" r="10" fill={colors.surface2} />
      <Path d="M19.6 17.4C25 15.6 32.6 16.6 38.4 21" stroke={colors.text} strokeWidth={2.4} fill="none" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: spacing.xxl, paddingBottom: spacing.xl },
  loading: { marginTop: spacing.xxl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.xxl },
  stat: { width: '50%', alignItems: 'center', gap: spacing.md },
  circle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { fontFamily: fonts.semibold, fontSize: 22, color: colors.text },
  label: { fontSize: 16 },
  since: { marginTop: spacing.xxl, letterSpacing: 0.5 },
});
