import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

// Scrollable area that stays usable when the keyboard is open.
export function KeyboardScroll({ children, contentStyle }: Props) {
  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.grow, contentStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grow: { flexGrow: 1 },
});
