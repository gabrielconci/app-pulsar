import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppText } from './AppText';
import { Button } from './Button';

type Props = {
  visible: boolean;
  message: string;
  // Label of the action that goes ahead (e.g. "Abandonar", "Excluir").
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

// Small confirmation card, as "Deseja abandonar o projeto?" in Figma:
// orange "Voltar" (stay) and grey action button.
export function ConfirmDialog({ visible, message, confirmLabel, onConfirm, onCancel, loading }: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} accessibilityLabel="Voltar" />
        <View style={styles.card} accessibilityRole="alert">
          <AppText variant="bodyStrong" align="center">
            {message}
          </AppText>
          <View style={styles.buttons}>
            <Button title="Voltar" style={styles.flex} onPress={onCancel} disabled={loading} />
            <Button title={confirmLabel} variant="secondary" style={styles.flex} onPress={onConfirm} loading={loading} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    padding: spacing.form,
  },
  card: { backgroundColor: colors.bg, borderRadius: radius.md, padding: spacing.xl, gap: spacing.xl },
  buttons: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
});
