import { z } from 'zod';
import { ageFromIso, parseBrDate } from '@/utils/date';
import { isValidCpf } from '@/utils/cpf';

export const profileFormSchema = z.object({
  fullName: z.string().trim().min(1, 'Informe seu nome.').max(100, 'Use no máximo 100 caracteres.'),
  cpf: z.string().refine(isValidCpf, 'CPF inválido.'),
  birthDate: z.string().refine((value) => {
    const iso = parseBrDate(value);
    if (!iso) return false;
    const age = ageFromIso(iso);
    return age >= 5 && age <= 120;
  }, 'Data inválida. Use dd/mm/aaaa.'),
  bio: z.string().max(500, 'Use no máximo 500 caracteres.'),
});

export type ProfileForm = z.infer<typeof profileFormSchema>;
