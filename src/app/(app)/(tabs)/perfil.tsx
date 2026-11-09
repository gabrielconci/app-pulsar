import { ComingSoon } from '@/components/layout/ComingSoon';
import { Button } from '@/components/ui';
import { signOut } from '@/features/auth/api';

// Full profile comes in a later step. "Sair" is here to test the login flow.
export default function ProfileScreen() {
  return (
    <ComingSoon title="Perfil">
      <Button title="Sair" variant="secondary" onPress={signOut} />
    </ComingSoon>
  );
}
