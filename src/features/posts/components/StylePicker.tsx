import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppText, Chip } from '@/components/ui';
import { useInterests } from '@/features/interests/hooks';
import { colors, spacing } from '@/theme';

type Props = {
  value: number | null;
  onChange: (id: number | null) => void;
};

// Dance style of a post (one of the interests), shown on the cards
// ("Jazz", "Contemporâneo"). Tap again to clear.
export function StylePicker({ value, onChange }: Props) {
  const interests = useInterests();

  return (
    <View style={styles.wrap} accessibilityRole="radiogroup" accessibilityLabel="Estilo">
      <AppText variant="label">Estilo (opcional)</AppText>
      {interests.isPending ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <View style={styles.chips}>
          {interests.data?.map((interest) => (
            <Chip
              key={interest.id}
              label={interest.name}
              selected={value === interest.id}
              onPress={() => onChange(value === interest.id ? null : interest.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
