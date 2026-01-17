Project Summary
Calliesport v2-next is a Padel Tournament Management Application built with Next.js 16 and React 19. It's a mobile-first web app designed to manage padel (a paddle sport) tournaments with automatic player pairings, score tracking, and live leaderboards.

Tech Stack
Framework: Next.js 16 (App Router) + React 19 + TypeScript
UI: Tailwind CSS 4 + shadcn/ui + Radix UI components
Forms: React Hook Form + Zod validation
Storage: Browser localStorage (client-side only)

Core Features
Tournament Creation: Support 4-12 players, multiple formats (Americano, Mexicano), configurable scoring systems (21pts, 16pts, Best of 4/5)
Automatic Pairings: Generates rounds with rotating team combinations
Score Tracking: Match-by-match score input with validation
Live Leaderboard: Real-time rankings based on wins, losses, and points
Round Navigation: Tab-based interface (Rounds, Rankings, Details)
Tournament Extensions: Add extra rounds (Set 2) or end tournament

Project Structure
app/ - Next.js pages (home, create tournament, tournament details)
components/ui/ - Reusable UI components (buttons, dialogs, forms)
utils/tournament.ts - Core tournament logic & data models
Mobile-optimized (393px fixed width)

The app is currently in active development with recent work on pairing algorithms, UI improvements, and bug fixes for player management.