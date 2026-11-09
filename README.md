# Pulsar

Portfólio digital para bailarinos. App em React Native (Expo + TypeScript), backend em Supabase.

## Estrutura

```
src/
  app/                   Rotas (Expo Router): cada arquivo é uma tela
    (auth)/              Login, cadastro, confira seu email
    (onboarding)/        Criar perfil, interesses
    (app)/(tabs)/        Home, Descobrir*, Notificações*, Perfil  (*inativas na v1)
  components/
    ui/                  Peças básicas: AppText, Button, TextField, Chip, Icon
    layout/              AppHeader, HeroLayout, BackButton, TabIcon...
  features/              Lógica por funcionalidade (api, hooks, componentes)
    auth/  profile/  interests/
  lib/                   Cliente Supabase, mensagens de erro
  theme/                 Cores, fontes, espaçamentos (tema claro)
  types/database.ts      Tipos gerados do banco (npm run gen:types)
  utils/                 CPF, datas
assets/
  fonts/                 Bahnschrift (Light, Regular, SemiBold, Bold)
  images/                Fotos de fundo das telas de entrada
supabase/
  config.toml            Configuração do projeto Supabase
  migrations/            Banco de dados (tabelas, regras de acesso, funções)
  functions/             Edge Functions
    login/               Login por usuário, email ou CPF
    delete-account/      Exclusão de conta
    change-signup-email/ "Usar outro email" antes da confirmação
  tests/                 Testes do banco (rodam sem Docker, via PGlite)
```

## Rodar o app

1. `npm install`
2. Copie `.env.example` para `.env` e preencha com a URL e a anon key do Supabase.
3. `npm start` e abra no Android com o app **Expo Go** (leia o QR code).

Antes de dar a tarefa por concluída: `npm run typecheck` e `npm run lint`.

## Backend

### O que existe

| Parte | Descrição |
|---|---|
| `profiles` | Perfil público: usuário, nome, data de nascimento, sobre mim, gênero, foto. Criado automaticamente no cadastro. |
| `profile_private` | CPF (validado e único). Só o dono lê. |
| `interests` / `profile_interests` | 24 estilos de dança; máximo de 8 por usuário. `set_my_interests(ids)` substitui todos de uma vez. |
| `posts` / `post_media` | Tipos: `video` (1 vídeo de até 30 s), `photo` (1 foto), `carousel` (2 a 10 fotos/vídeos), `project` (título, subtítulo, texto e 1 a 3 imagens, a primeira é a capa). Criados só via `create_post(...)`, que valida tudo. |
| Storage | Buckets `avatars` (5 MB, imagens) e `post-media` (50 MB, imagens e vídeos). Cada usuário escreve só na pasta `<id do usuário>/`. Leitura pública. |
| `get_profile_stats(id)` | Aba Estatísticas. Aclamações, público e conexões ficam em 0 até essas funções existirem. |
| `is_username_available` / `is_cpf_available` | Validação nos formulários. |
| Edge Function `login` | Recebe `{ identifier, password }` e devolve a sessão. Aceita email, usuário (com ou sem `@`) e CPF (com ou sem máscara). |
| Edge Function `delete-account` | Apaga arquivos, registra o motivo (anônimo) e exclui a conta com tudo dela. |

### Fluxo de cadastro no app

1. `supabase.auth.signUp({ email, password, options: { data: { username } } })` → o perfil é criado sozinho.
2. Tela "Criar perfil": `update` em `profiles` (nome, data, sobre mim, foto) e em `profile_private` (CPF); depois preenche `onboarding_completed_at`.
3. Tela de interesses: `rpc('set_my_interests', { p_interest_ids: [...] })`.

### Colocar no ar (uma vez)

1. Crie um projeto em [supabase.com](https://supabase.com) (região São Paulo).
2. No terminal, dentro desta pasta:
   ```bash
   npx supabase login
   npx supabase link --project-ref <ref-do-projeto>
   npx supabase db push
   npx supabase functions deploy login
   npx supabase functions deploy delete-account
   ```
3. No painel do Supabase → Authentication:
   - Senha mínima de 8 caracteres, com letras e números (o `config.toml` só vale para ambiente local).
   - Decida se o email precisa ser confirmado antes do primeiro login.

### Testes do banco

```bash
npm run test:db
```

Os testes rodam as migrações num Postgres embutido (PGlite), com uma simulação mínima do `auth` e do `storage` do Supabase (`supabase/tests/supabase-stubs.sql`). Eles não substituem um teste no Supabase real: as Edge Functions só são testadas depois do deploy.

### Limitações conhecidas

- A duração do vídeo (≤ 30 s) é informada pelo app; o banco valida o número, mas não inspeciona o arquivo.
- O limite de 50 MB por arquivo é o do plano gratuito do Supabase; o app deve comprimir os vídeos antes do envio.
- Arquivos dos buckets são públicos para quem tiver o link (adequado para portfólio).
