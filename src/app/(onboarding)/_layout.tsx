import { Stack } from 'expo-router';
import { colors } from '@/theme';

export const unstable_settings = { initialRouteName: 'criar-perfil' };

export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />;
}
