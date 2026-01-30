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

#### 1. **Pairing Algorithm** (Perfect Whist Tournament Matrices)
- **Goal**: Ensure balanced partnerships and opponents across all rounds
- **All player counts (4-8) use hardcoded perfect Whist Tournament Matrices** for optimal balance:
  - `WHIST_MATRIX_4_PLAYERS`: 6 rounds - each pair partners 2×, opposes 4×
  - `WHIST_MATRIX_5_PLAYERS`: 10 rounds - each player plays 8 matches, rests 2×
  - `WHIST_MATRIX_6_PLAYERS`: 15 rounds - each pair partners 2×, opposes 4×
  - `WHIST_MATRIX_7_PLAYERS`: 21 rounds - balanced rotation with rest
  - `WHIST_MATRIX_8_PLAYERS`: 14 rounds - each pair partners 1×, opposes 2×
- **No dynamic algorithm**: All pairings are predetermined via matrices for perfect mathematical balance

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

**Important**: Validation errors should only be displayed when the user clicks the submit button (e.g., "Create"), not proactively while the user is filling the form. Use state to store validation errors and set them in `onSubmit`:
```typescript
const [validationError, setValidationError] = useState("");

const onSubmit = (data: FormData) => {
  const validation = validateData();
  if (!validation.valid) {
    setValidationError(validation.error);
    return;
  }
  setValidationError(""); // Clear error on success
  // ... proceed with form submission
};
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
- **Standard Americano**: Fully implemented for 4-8 players (`isTeamTypeSupported()` returns `true`)
- **Mix Americano**: Fully implemented for 6 or 8 players (`isTeamTypeSupported()` returns `true`)
  - 6 players: 3 men + 3 women, 9 rounds (extendable to 18)
  - 8 players: 4 men + 4 women, 24 rounds
  - Each team always has 1 man + 1 woman (mixed pairs)
  - Implementation in [utils/MixAmericanoTournament.ts](utils/MixAmericanoTournament.ts)
- Team Americano, Standard Mexicano show "Coming Soon" placeholder

### Player Limits
- **Standard Americano**: 4-8 players (`MIN_PLAYERS=4`, `MAX_PLAYERS=8`)
- **Mix Americano**: 6 or 8 players only (must have equal men and women)

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
- `validateWhistMatrixBalance()` logs partner/opponent counts to console for all player counts (4-8)
- Used during development to verify Whist matrix correctness for Standard Americano
- Mix Americano uses separate schedule validation (check man/woman pairing constraints)

## Common Tasks

### Adding a New Tournament Feature
1. Add data fields to `Tournament` interface in [utils/tournament.ts](utils/tournament.ts)
2. Update `TournamentSchema` in [utils/form-schemas.ts](utils/form-schemas.ts)
3. Add business logic functions in [utils/tournament.ts](utils/tournament.ts) (Standard) or [utils/MixAmericanoTournament.ts](utils/MixAmericanoTournament.ts) (Mix)
4. Update UI in [app/tournament/[id]/page.tsx](app/tournament/[id]/page.tsx) or related component

### Modifying Pairing Algorithm
- **Standard Americano (4-8 players)**: Edit `WHIST_MATRIX_*_PLAYERS` arrays in [utils/tournament.ts](utils/tournament.ts)
- **Mix Americano (6/8 players)**: Edit `SCHEDULE_DATA_6_PLAYERS` or `SCHEDULE_DATA_8_PLAYERS` in [utils/MixAmericanoTournament.ts](utils/MixAmericanoTournament.ts)
- Always test with `validateWhistMatrixBalance()` or manual pairing count verification
- All matrices are hardcoded for perfect mathematical balance - changes require careful validation

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