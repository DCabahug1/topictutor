# TopicTutor 🎓

An AI-powered learning platform. Pick any topic, take a short placement test, and Claude writes a 10-chapter course aimed at the areas where you struggled.

## Features

- **Placement tests**: A 5-question test measures what you already know about a topic
- **AI-generated courses**: Claude writes a personalized 10-chapter course from your results
- **Final tests**: A 10-question test based on your chapters, with a 70% passing score
- **Progress tracking**: Chapter progress, topic completion, a daily streak, and a recent activity chart
- **Topic dashboard**: Search your courses and pick up where you left off
- **Authentication**: Email and password, or Google OAuth
- **Profiles**: Edit your name and upload an avatar
- **Light and dark themes**: Follows your system setting, with a manual toggle

## Tech Stack

- **Framework**: Next.js 16 (App Router, Server Actions), React 19, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui, Radix UI
- **Authentication**: Supabase Auth (email/password and Google OAuth)
- **Database**: Supabase (PostgreSQL)
- **File storage**: Supabase Storage
- **AI**: Claude Sonnet 5.5 through the Anthropic TypeScript SDK, with Zod schemas
- **Charts**: Recharts
- **Animations**: Motion
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 11 (`corepack enable` picks up the pinned version)
- A Supabase project
- An Anthropic API key

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/DCabahug1/topictutor.git
   cd topictutor
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Create a `.env.local` file in the root directory:

   ```bash
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Anthropic
   ANTHROPIC_API_KEY=your_anthropic_api_key
   ```

4. Set up your Supabase project. The repository does not include migrations, so follow the [Supabase setup guide](CONTRIBUTING.md#supabase-setup) to create the tables, policies, storage bucket, and auth settings.

5. Start the development server:

   ```bash
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Create a production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Run ESLint |

## How It Works

### Placement Test

Claude generates 5 multiple-choice questions on your topic, each with 4 options, at a mix of easy, medium, and hard difficulty. Your results are saved and passed to course generation.

### Course Generation

Claude refines the topic title, assigns one of 11 categories, and writes 10 chapters of 3 paragraphs each, prioritizing the areas where the placement test showed the most weakness. The topic and chapters are then saved to Supabase.

### Final Test

Claude generates 10 multiple-choice questions limited to the course's chapters and modeled on the format of your placement test. Every attempt is saved, and scoring 70% or higher marks the topic as complete.

### Progress Tracking

Finishing a chapter updates the topic's progress. The streak counts consecutive days on which a completed topic was last updated, and the profile page charts topics completed over the past week.

### Authentication

- Email registration sends a confirmation link
- Google sign-in uses Supabase OAuth
- A profile is created automatically at `/auth/callback` on first sign-in
- Sessions are managed by Supabase Auth and refreshed in middleware

## AI Integration

All Claude calls go through `generateStructured` in `lib/claude.ts`, which uses the `claude-sonnet-5-5` model. Each request streams its response, so long course generations don't hit HTTP timeouts, and validates the output against a Zod schema. Claude is used to:

- Generate placement tests
- Create personalized courses
- Generate final tests

## Database

The application uses these Supabase tables:

- `profiles`: User profile information
- `topics`: Generated courses and their progress
- `chapters`: Course chapters and their content
- `test_results`: Placement and final test results

Avatars are stored in the `profile_files` storage bucket. See [CONTRIBUTING.md](CONTRIBUTING.md#supabase-setup) for the columns and policies the code expects.

## Project Structure

```
topictutor/
├── app/                     # Next.js App Router
│   ├── auth/                # Login, registration, and OAuth callback
│   ├── components/          # Landing page sections
│   ├── dashboard/           # Topic list and search
│   ├── placement-test/      # Placement test flow
│   ├── profile/             # Profile, streak, and activity
│   ├── topic/[topic_id]/    # Course overview, chapters, and final test
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/              # Shared components and shadcn/ui primitives
├── lib/                     # Core application logic
│   ├── actions.ts           # Sign-up server action
│   ├── auth.ts              # Authentication services
│   ├── chapters.ts          # Chapter management
│   ├── claude.ts            # Anthropic client and structured generation
│   ├── generateCourse.ts    # AI course generation
│   ├── models.ts            # Shared TypeScript types
│   ├── placementTest.ts     # AI placement test generation
│   ├── profiles.ts          # Profiles and avatar uploads
│   ├── testResults.ts       # Test result storage
│   ├── topics.ts            # Topics, search, and streaks
│   ├── topicTest.ts         # AI final test generation
│   └── utils.ts             # Class name helper
├── public/                  # Static assets
├── utils/supabase/          # Supabase clients for browser, server, and middleware
└── middleware.ts            # Session refresh and route protection
```

## Security

- Every route except `/` and `/auth/*` redirects to the login page when there is no session
- `ANTHROPIC_API_KEY` is only used on the server
- Secrets stay in `.env.local`, which is ignored by Git
- Database access goes through the Supabase client, with no hand-written SQL in the app
- Separating one user's data from another's depends on Row Level Security, because topic and chapter queries do not filter by user. Any new Supabase project needs these policies, as described in the [setup guide](CONTRIBUTING.md#row-level-security).

## Deployment

The project is set up for [Vercel](https://vercel.com/). Other hosts that support Next.js 16 may work but have not been tested.

1. Add these environment variables to your deployment:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY`
2. In Supabase, add `https://your-domain/auth/callback` to the allowed redirect URLs and set the Site URL to your domain.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Supabase](https://supabase.com/)
- AI capabilities by [Anthropic](https://www.anthropic.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/) and [Radix UI](https://www.radix-ui.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
