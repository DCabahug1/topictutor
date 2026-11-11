# TopicTutor 🎓

An AI-powered personalized learning platform that creates custom courses based on placement test results and generates interactive content using Claude.

## Features

- **Personalized Learning**: Takes a placement test to assess your knowledge level
- **AI-Generated Content**: Creates custom courses and chapters using Claude
- **Interactive Tests**: Placement tests and final assessments for each topic
- **Progress Tracking**: Monitor your learning progress and completion streaks
- **User Authentication**: Secure login with email/password or Google OAuth
- **Profile Management**: Customizable user profiles with avatar uploads
- **Responsive Design**: Modern UI built with Next.js and Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Authentication**: Supabase Auth (Email/Password + Google OAuth)
- **Database**: Supabase (PostgreSQL)
- **AI Integration**: Claude Sonnet 5.5 (Anthropic API)
- **File Storage**: Supabase Storage
- **Animations**: Motion (Framer Motion)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- Supabase account
- Anthropic API account

### Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Anthropic Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/topictutor.git
cd topictutor
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up your environment variables (see above)

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

The application uses the following main tables in Supabase:

- `profiles` - User profile information
- `topics` - Generated learning topics/courses
- `chapters` - Course chapters with content
- `test_results` - Placement and final test results

## Project Structure

```
topictutor/
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   ├── topic/             # Topic-related pages
│   └── layout.tsx         # Root layout
├── components/            # Reusable UI components
├── lib/                   # Core business logic
│   ├── auth.ts           # Authentication services
│   ├── generateCourse.ts # AI course generation
│   ├── placementTest.ts  # Placement test logic
│   ├── topics.ts         # Topic management
│   ├── chapters.ts       # Chapter management
│   ├── profiles.ts       # User profile management
│   └── testResults.ts    # Test result handling
├── utils/                 # Utility functions
│   └── supabase/         # Supabase client configuration
└── middleware.ts          # Authentication middleware
```

## Key Features Explained

### Placement Tests
- AI-generated questions based on the chosen topic
- 5 multiple-choice questions with varying difficulty
- Results used to personalize course content

### Course Generation
- Creates 10-chapter courses tailored to placement test results
- Each chapter includes detailed content paragraphs
- Focuses on areas where the user shows weakness

### Progress Tracking
- Chapter completion tracking
- Learning streaks calculation
- Topic completion status

### Authentication Flow
- Email/password registration with email confirmation
- Google OAuth integration
- Automatic profile creation
- Session management via Supabase Auth

## Security Features

- ✅ Secure authentication with Supabase Auth
- ✅ Parameterized database queries (no SQL injection risk)
- ✅ Environment variable configuration for secrets
- ✅ Server-side API key protection
- ✅ Middleware-based route protection
- ✅ File upload security via Supabase Storage

## API Integration

### Claude Integration
The app uses Anthropic's Claude Sonnet 5.5 model for:
- Generating placement test questions
- Creating personalized course content
- Generating final assessments

All AI interactions use structured output with Zod validation for type safety.

## Deployment

### Environment Setup
Ensure all environment variables are configured in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 
- `ANTHROPIC_API_KEY`

### Recommended Platforms
- **Vercel** (recommended for Next.js)
- **Netlify**
- **Railway**
- **Render**

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Supabase](https://supabase.com/)
- AI capabilities by [Anthropic](https://www.anthropic.com/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)