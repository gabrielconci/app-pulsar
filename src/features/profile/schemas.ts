import { z } from 'zod';
import { usernameSchema } from '@/features/auth/schemas';
import { ageFromIso, parseBrDate } from '@/utils/date';
import { isValidCpf } from '@/utils/cpf';

const fullName = z.string().trim().min(1, 'Informe seu nome.').max(100, 'Use no máximo 100 caracteres.');
const birthDate = z.string().refine((value) => {
  const iso = parseBrDate(value);
  if (!iso) return false;
  const age = ageFromIso(iso);
  return age >= 5 && age <= 120;
}, 'Data inválida. Use dd/mm/aaaa.');
const bio = z.string().max(500, 'Use no máximo 500 caracteres.');

// "Criar perfil": with CPF (username was chosen on Cadastro).
export const profileFormSchema = z.object({
  fullName,
  cpf: z.string().refine(isValidCpf, 'CPF inválido.'),
  username: z.string(),
  birthDate,
  bio,
  contactEmail: z.string(),
});

// "Editar perfil" (Figma): username instead of CPF, plus the optional
// contact email shown on the profile.
export const editProfileSchema = profileFormSchema.extend({
  cpf: z.string(),
  username: usernameSchema,
  contactEmail: z
    .string()
    .trim()
    .max(254, 'Use no máximo 254 caracteres.')
    .refine((v) => v === '' || z.email().safeParse(v).success, 'Email inválido.'),
});

export type ProfileForm = z.infer<typeof profileFormSchema>;
