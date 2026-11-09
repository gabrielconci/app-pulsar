import { AppText } from '@/components/ui';

// "PULSAR" wordmark: PUL in text color, SAR in light grey.
export function Logo() {
  return (
    <AppText variant="logo" accessibilityRole="header" accessibilityLabel="Pulsar">
      PUL<AppText variant="logo" color="text3">SAR</AppText>
    </AppText>
  );
}
