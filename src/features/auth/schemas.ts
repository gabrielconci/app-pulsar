import { z } from 'zod';

const password = z
  .string()
  .min(8, 'Use pelo menos 8 caracteres.')
  .max(72, 'Use no máximo 72 caracteres.')
  .regex(/[a-zA-Z]/, 'Inclua pelo menos uma letra.')
  .regex(/\d/, 'Inclua pelo menos um número.');

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Use pelo menos 3 caracteres.')
  .max(30, 'Use no máximo 30 caracteres.')
  .regex(/^[a-z0-9._]+$/, 'Use só letras, números, ponto e sublinhado.')
  .regex(/[a-z]/, 'Inclua pelo menos uma letra.');

export const emailSchema = z.string().trim().toLowerCase().email('Email inválido.');

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Informe seu usuário, email ou CPF.'),
  password: z.string().min(1, 'Informe sua senha.'),
});

export const signUpSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não são iguais.',
  });

export type LoginForm = z.infer<typeof loginSchema>;
export type SignUpForm = z.input<typeof signUpSchema>;
