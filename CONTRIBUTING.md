# Contributing to TopicTutor

Thanks for your interest in improving TopicTutor. This guide covers setting up your own environment, where code belongs, and how to submit a change.

## Local Setup

Follow the [installation steps in the README](README.md#installation) to install dependencies and create `.env.local`. You will need your own Supabase project and Anthropic API key. Generating tests and courses makes real API calls, which are billed to your key.

## Supabase Setup

The Almanac tables (`daily_lessons`, `series`, `series_lessons`, `mastery`, `placements` and the rest) are created by the migrations in `supabase/migrations/`. Apply them in order, for example with `supabase db push`, and add a new migration for every schema change.

The tables below belong to the older topic and chapter screens, which have no migrations. They are derived from what the code reads and writes, so treat them as the minimum those screens need.

### Tables

Create these tables in the `public` schema. Each `id` should be a generated primary key.

**`profiles`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | generated | |
| `user_id` | `uuid` | The Supabase Auth user |
| `name` | `text` | |
| `email` | `text` | Used to look up the profile |
| `image_url` | `text` | Nullable |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Default `now()` |

**`topics`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | integer, generated | Must be an integer because test results parse it with `parseInt` |
| `user_id` | `uuid` | Default `auth.uid()`, because the app does not set it on insert |
| `title` | `text` | |
| `category` | `text` | |
| `description` | `text` | |
| `chapters_count` | `integer` | |
| `chapters_completed` | `integer` | Default `0` |
| `completed` | `boolean` | Default `false` |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Set by the app |

**`chapters`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | generated | |
| `user_id` | `uuid` | Default `auth.uid()`, because the app does not set it on insert |
| `topic_id` | `integer` | References `topics.id` |
| `title` | `text` | |
| `description` | `text` | |
| `content_paragraphs` | `text[]` or `jsonb` | Array of strings |
| `completed` | `boolean` | Default `false` |
| `chapter_number` | `integer` | |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Set by the app |

**`test_results`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | generated | |
| `user_id` | `uuid` | Set by the app |
| `topic_id` | `integer` | Nullable, references `topics.id` |
| `type` | `text` | `placement` or `topic`. A final test is saved as `topic`. |
| `result` | `jsonb` | The questions and answers |
| `created_at` | `timestamptz` | Default `now()` |

### Row Level Security

Enable RLS on all four tables and add policies so users can only select, insert, and update rows where `user_id = auth.uid()`.

These policies are required. `getTopics`, `getTopicById`, and the chapter queries do not filter by user, so without RLS every user would see everyone's courses. When you add a query, don't assume it is safe just because the app calls it from a signed-in page.

### Storage

Create a public bucket named `profile_files`. Avatars are uploaded to `{user_id}/avatars/{profile_id}_avatar_{version}`, so signed-in users need permission to list and upload files within their own `{user_id}` folder.

### Authentication

In your Supabase project's Auth settings:

1. Set the Site URL to `http://localhost:3000`.
2. Add `http://localhost:3000/auth/callback` to the allowed redirect URLs.
3. Keep email confirmation on. Profiles are created at `/auth/callback`, so an account that never goes through the confirmation link won't get a profile.
4. Optionally enable the Google provider to test Google sign-in.

## Where Code Goes

- **Routes** live in `app/`. Components used by a single route sit in a `components/` folder next to it.
- **Shared components** live in `components/`, and shadcn/ui primitives in `components/ui/`. Add new primitives with `pnpm dlx shadcn@latest add <component>`.
- **Application logic** lives in `lib/`, and shared types in `lib/models.ts`.
- **Imports** use the `@/` alias for paths from the project root.

## Conventions

### Data Access

- Use `@/utils/supabase/server` in server code and `@/utils/supabase/client` in browser code.
- Modules in `lib/` that use the server client start with `"use server"` and return an object such as `{ data, error }` or `{ success, error }` instead of throwing. Follow the shape used by the file you are editing.
- Don't add logic between `createServerClient` and `getClaims` in `utils/supabase/middleware.ts`. Doing so can cause random sign-outs.

### AI Features

- Call Claude through `generateStructured` in `lib/claude.ts`, and pass a Zod schema describing the output.
- Only import `lib/claude.ts` from `"use server"` modules, so the API key stays on the server.
- Name models with the `SONNET` and `HAIKU` constants in `lib/claude.ts`. Calls default to Sonnet; pass `model: HAIKU` where a cheaper model writes well enough (lesson prose, tutor answers, check retries).

### UI

- Style with Tailwind and the theme variables in `app/globals.css`, and check your change in both light and dark mode.
- Use `motion/react` for animation and `lucide-react` for icons.

### Secrets and Logging

- Never commit `.env.local` or any key.
- Never log passwords, tokens, or API keys.

## Dependencies

This project uses pnpm only, so please don't add a `package-lock.json` or `yarn.lock`.

pnpm may reject a package published too recently under its `minimumReleaseAge` policy. If that happens, pin the newest version outside the window instead of bypassing the check. Packages that need install scripts must be listed under `allowBuilds` in `pnpm-workspace.yaml`.

## Before Opening a Pull Request

Run the type check and production build, both of which should pass:

```bash
pnpm exec tsc --noEmit
```

```bash
pnpm build
```

Then run the linter:

```bash
pnpm lint
```

`pnpm lint` currently fails because of existing problems across the codebase. Please don't add new ones, and fix any in the code you touch where that is practical.

The project has no automated tests, so try your change in the running app. For anything touching the main flow, walk through it end to end:

1. Sign in, or register and confirm your email.
2. Start a topic from the dashboard and finish the placement test.
3. Wait for the course to generate, then open a chapter and complete it.
4. Take the final test and score at least 70%.
5. Check that the dashboard and the profile's streak and activity reflect the result.

## Submitting Changes

1. Branch from `staging`, using a name like `feature/short-description` or `fix/short-description`.
2. Keep each pull request focused on one change.
3. Write short, imperative commit messages, such as `Add topic search to dashboard`.
4. Open your pull request against `staging`. `main` is updated from `staging`.
5. In the description, explain what changed and why, how you tested it, and any Supabase changes it needs. Include screenshots for UI changes.

## Reporting Bugs

Open a [GitHub issue](https://github.com/DCabahug1/topictutor/issues) with the steps to reproduce the bug, what you expected, and what happened instead.

For security problems, please don't post the details publicly. Open an issue asking for a private way to reach the maintainer.

## License

This repository does not currently include a license. Please check with the maintainer if you need to reuse code from it elsewhere.
