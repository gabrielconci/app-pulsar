import { z } from 'zod';

export const captionSchema = z.string().trim().max(2200, 'A legenda pode ter até 2200 caracteres.');

const projectSchema = z.object({
  title: z.string().trim().min(1, 'Dê um título ao projeto.').max(100, 'O título pode ter até 100 caracteres.'),
  subtitle: z.string().trim().max(200, 'O subtítulo pode ter até 200 caracteres.'),
  body: z.string().trim().min(1, 'Escreva o texto do projeto.').max(10000, 'O texto pode ter até 10000 caracteres.'),
  caption: captionSchema,
  interestId: z.number().nullable(),
});

const mediaPostSchema = z.object({
  title: z.string().trim().max(100, 'O título pode ter até 100 caracteres.'),
  subtitle: z.string(),
  body: z.string(),
  caption: captionSchema,
  interestId: z.number().nullable(),
});

// Text of a post: projects need title and text; other posts only a caption.
export function postTextSchema(isProject: boolean) {
  return isProject ? projectSchema : mediaPostSchema;
}

export const commentSchema = z.string().trim().min(1).max(1000, 'O comentário pode ter até 1000 caracteres.');
