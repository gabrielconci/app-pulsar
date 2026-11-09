import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import { spacing } from '@/theme';
import { AppHeader } from './AppHeader';

// Temporary screen for parts of the app that are not built yet.
export function ComingSoon({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <View style={styles.screen}>
      <AppHeader />
      <View style={styles.body}>
        <AppText variant="title" align="center">
          {title}
        </AppText>
        <AppText variant="body" color="text2" align="center">
          Em breve.
        </AppText>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1, alignItems: 'stretch', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.form },
});
