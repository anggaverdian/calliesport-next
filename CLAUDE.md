# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Calliesport v2-next is a **Padel Tournament Management Application** built with Next.js 16. It manages tournament creation, player pairings, score tracking, and leaderboard rankings for padel tournaments. All data is stored client-side in browser localStorage (no backend/database).

**Tech Stack**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui, React Hook Form, Zod

## Development Commands

```bash
# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Core Architecture

### Data Flow & State Management

- **No Backend**: All tournament data persists in browser `localStorage` with key `calliesport_tournaments`
- **Data Validation**: Zod schemas validate localStorage data integrity on read ([utils/form-schemas.ts](utils/form-schemas.ts))
- **Input Sanitization**: All user input (tournament names, player names) is sanitized to prevent XSS via `sanitizeString()` and `sanitizeStringArray()` functions
- **State Updates**: Tournament state changes (score updates, extend rounds, end game) write directly to localStorage via `updateTournament()`

### Tournament Algorithm System

The core tournament logic lives in [utils/tournament.ts](utils/tournament.ts). Key algorithms:

#### 1. **Pairing Algorithm** (Round Robin Rotation)
- **Goal**: Ensure balanced partnerships and opponents across all rounds
- **For 6 & 8 Players**: Uses deterministic **Whist Tournament Matrix** (`WHIST_MATRIX_6_PLAYERS`, `WHIST_MATRIX_8_PLAYERS`) for perfect balance
  - 6 players: Each pair partners 2× and opposes 4×
  - 8 players: Each pair partners 1× and opposes 2×
- **For Other Counts (4, 5, 7, 9-12)**: Uses dynamic rotation algorithm with scoring:
  1. Tracks play counts, partner counts, opponent counts per player/pair
  2. Prioritizes lowest play count players for next match
  3. Scores pairings to minimize repeated partnerships/opponents
  4. Applies **cross-pairing bonus**: previous partners become opponents in next round

#### 2. **Round Generation**
- `generateTournamentRounds(players)`: Creates all rounds with shuffled player order
- `generateTournamentRoundsWithFirstMatch(players, teamA, teamB)`: Allows user to specify Round 1 lineup, then generates balanced rounds from there
- `extendTournament(tournamentId)`: Adds Set 2 rounds while preserving pairing history balance

#### 3. **State Tracking**
- `RoundRobinState` interface tracks:
  - `playCount`: How many matches each player has played
  - `lastPlayedRound`: When each player last played (for rest time balancing)
  - `partnerCount`: How many times each pair has partnered
  - `opponentCount`: How many times each pair has opposed

### URL State Management

Tournament detail page uses URL params to persist navigation state:
- `?tab=round|ranking|details` - Current tab view
- `?round=1` - Current round number
- Navigation updates URL without page reload via `router.replace()` with `scroll: false`

### Form Validation Pattern

All forms use React Hook Form + Zod resolver:
```typescript
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: { ... }
});
```

### Component Architecture

- **App Router Structure**: Each route is a folder with `page.tsx`
  - `/` - Home/tournament list
  - `/create-tournament` - Tournament creation form
  - `/tournament/[id]` - Tournament detail (dynamic route)
- **UI Patterns**: Custom components in `app/ui_pattern/` (AppBar, ScoreCard, LeaderboardTable, etc.)
- **Reusable UI**: shadcn/ui components in `components/ui/` (Button, Dialog, Drawer, Tabs, etc.)

## Key Business Rules

### Tournament Types
- **Only "Standard Americano" is fully implemented** (`isTeamTypeSupported()` returns `true` only for `"standard"`)
- Mix Americano, Team Americano, Standard Mexicano show "Coming Soon" placeholder

### Player Limits
- Minimum: 4 players (`MIN_PLAYERS`)
- Maximum: 12 players (`MAX_PLAYERS`)

### Tournament Lifecycle
1. **Create**: Generate rounds based on player count (formula in `calculateRounds()`)
2. **Play**: Input scores per match, track completion status
3. **Extend** (optional, once): Add Set 2 rounds via `extendTournament()` - only allowed after completing all Set 1 rounds
4. **End**: Mark tournament complete via `endTournament()` - prevents further score input

### Score Input
- Point types: "21", "16", "best4" (Best of 4), "best5" (Best of 5)
- `getMaxScore(pointType)` returns max allowed score
- Cannot modify scores after tournament is ended

## Important Implementation Notes

### Security
- **XSS Prevention**: All user input sanitized via `sanitizeString()` before storage/rendering
- Input sanitization removes: `<>`, `javascript:`, event handlers (`onclick=`, etc.)

### Mobile-First Design
- Fixed width: 393px (mobile device viewport)
- Uses Drawer components for modals (mobile UX)
- Touch-optimized spacing and buttons

### UI Components
- **Always use shadcn/ui components** when building pages or UI patterns
- Use Shadcn components like Button, Label, Badge, Input, Select, Form components or et cetera from `components/ui/`
- Avoid raw HTML elements where shadcn equivalents exist

## UI Components Policy
- **Shadcn UI**: If a required component is missing from the `components/ui` directory, install it using the command: `npx shadcn@latest add "component name"`.
**Minimalist Installation**: Only install a Shadcn component if it is actually intended to be used in the current task. Do not install components that will not be immediately implemented.
- Do not manually create basic UI primitives if they are available in Shadcn.
- Always check `@/components/ui` before adding new UI logic.

### Validation & Error Handling
- localStorage reads validate with Zod schemas, fallback to empty array on corruption
- Tournament not found redirects to home with toast notification
- Duplicate player names prevented in create form

### Testing Pairing Balance
- `validateWhistMatrixBalance()` logs partner/opponent counts to console for 6/8 player tournaments
- Used during development to verify Whist matrix correctness

## Common Tasks

### Adding a New Tournament Feature
1. Add data fields to `Tournament` interface in [utils/tournament.ts](utils/tournament.ts)
2. Update `TournamentSchema` in [utils/form-schemas.ts](utils/form-schemas.ts)
3. Add business logic functions in [utils/tournament.ts](utils/tournament.ts)
4. Update UI in [app/tournament/[id]/page.tsx](app/tournament/[id]/page.tsx) or related component

### Modifying Pairing Algorithm
- **For 6/8 players**: Edit `WHIST_MATRIX_*_PLAYERS` arrays (testing requires math validation)
- **For other counts**: Adjust scoring in `scorePairing()` or selection logic in `generateRotationMatches()`
- Always test with `validateWhistMatrixBalance()` or manual pairing count verification

### Adding New Point Type
1. Add to `pointType` options in create tournament form
2. Update `getMaxScore()` switch statement
3. Update `getPointTypeLabel()` for display

## UI & Iconography Norms
- **Primary Icon Library:** Always use **Phosphor Icons**. Do not use Lucide, Heroicons, or FontAwesome.
- **Library Package:** Use `@phosphor-icons/react`.
- **Import Pattern:** Use named imports: `import { Horse, Heart, Cube } from "@phosphor-icons/react";`
- **Global Configuration:**
    - **Weight:** Default to `regular`. Use `duotone` for emphasis and `fill` for active/selected states.
    - **Sizing:** Standardize on `size={24}` for general UI and `size={20}` or `size={16}` for dense lists/buttons.
    - **Mirrored:** Enable `mirrored={true}` for RTL-sensitive icons like arrows if applicable.
- **Consistency:** Every page must use this icon set exclusively to maintain visual harmony.