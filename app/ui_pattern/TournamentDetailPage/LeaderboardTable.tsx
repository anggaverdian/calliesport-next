"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tournament, getMaxScore } from "@/utils/tournament";

interface PlayerStats {
  name: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  totalPoints: number;
  compensationPoints: number;
  finalScore: number;
}

interface LeaderboardTableProps {
  tournament: Tournament;
}

export default function LeaderboardTable({ tournament }: LeaderboardTableProps) {
  // Calculate player statistics
  const playerStats = calculatePlayerStats(tournament);

  return (
    <div className="space-y-4">
      {/* Leaderboard Table */}
      <Table>
        <TableHeader className="border-0">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-8 text-center text-xs font-normal text-clx-text-secondary">#</TableHead>
            <TableHead className="text-xs font-normal text-clx-text-secondary">Player</TableHead>
            <TableHead className="w-12 text-xs font-normal text-clx-text-secondary">MP</TableHead>
            <TableHead className="w-18 text-xs font-normal text-clx-text-secondary">W-L-T</TableHead>
            <TableHead className="w-12 text-xs font-normal text-clx-text-secondary">M+</TableHead>
            <TableHead className="w-14 text-xs text-center font-normal text-clx-text-secondary">Pts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {playerStats.map((player, index) => {
            const rank = index + 1;
            const isFirstPlace = rank === 1;

            return (
              <TableRow
                key={player.name}
                className={`border-b-1 border-clx-border-subtle ${
                  isFirstPlace
                    ? "bg-amber-300 hover:bg-amber-300"
                    : "bg-clx-bg-neutral-subtle hover:bg-clx-bg-neutral-hover"
                }`}
              >
                <TableCell
                  className={`py-3 text-center text-xs font-normal ${
                    isFirstPlace ? "text-clx-text-default" : "text-clx-text-placeholder"
                  }`}
                >
                  {rank}
                </TableCell>
                <TableCell
                  className={`py-3 text-sm font-medium ${
                    isFirstPlace ? "text-clx-text-default" : "text-clx-text-default"
                  }`}
                >
                  {player.name}
                </TableCell>
                <TableCell className="py-3 text-xs text-clx-text-default">
                  {player.matchesPlayed}
                </TableCell>
                <TableCell className="py-3 text-xs text-clx-text-default">
                  {player.wins}-{player.losses}-{player.ties}
                </TableCell>
                <TableCell className="py-3 text-xs text-clx-text-success">
                  {(() => {
                    // Check if player has compensation points
                    if (player.compensationPoints > 0) {
                      // Show +points (e.g., +10, +20)
                      return `+${player.compensationPoints}`;
                    } else {
                      // Show nothing if no compensation
                      return "";
                    }
                  })()}
                </TableCell>
                <TableCell
                  className={`py-3 text-center text-sm font-semibold ${
                    isFirstPlace ? "text-clx-text-default" : "text-clx-text-default"
                  }`}
                >
                  {player.finalScore}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Legend */}
      <div className="px-2 py-3 bg-clx-bg-neutral-subtle rounded-lg">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-clx-text-secondary">
          <span><span className="font-medium text-clx-text-default">MP</span> = Match Played</span>
          <span><span className="font-medium text-clx-text-default">W-L-T</span> = Win Lost Tied</span>
          <span><span className="font-medium text-clx-text-default">M+</span> = Point Compensation</span>
          <span><span className="font-medium text-clx-text-default">Pts</span> = Total point</span>
        </div>
      </div>
    </div>
  );
}

function calculatePlayerStats(tournament: Tournament): PlayerStats[] {
  const stats: Record<string, PlayerStats> = {};

  // Initialize stats for all players
  tournament.players.forEach((player) => {
    stats[player] = {
      name: player,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      totalPoints: 0,
      compensationPoints: 0,
      finalScore: 0,
    };
  });

  // Calculate stats from completed matches
  tournament.rounds.forEach((round) => {
    round.matches.forEach((match) => {
      if (match.isCompleted) {
        const isTie = match.scoreA === match.scoreB;
        const teamAWins = match.scoreA > match.scoreB;
        const teamBWins = match.scoreB > match.scoreA;

        // Update Team A players
        match.teamA.forEach((player) => {
          stats[player].matchesPlayed++;
          stats[player].totalPoints += match.scoreA;

          if (isTie) {
            stats[player].ties++;
          } else if (teamAWins) {
            stats[player].wins++;
          } else {
            stats[player].losses++;
          }
        });

        // Update Team B players
        match.teamB.forEach((player) => {
          stats[player].matchesPlayed++;
          stats[player].totalPoints += match.scoreB;

          if (isTie) {
            stats[player].ties++;
          } else if (teamBWins) {
            stats[player].wins++;
          } else {
            stats[player].losses++;
          }
        });
      }
    });
  });

  // Find maximum matches played
  const maxMatchesPlayed = Math.max(
    ...Object.values(stats).map((s) => s.matchesPlayed)
  );

  // Get compensation multiplier based on point type
  const getCompensationMultiplier = (pointType: string): number => {
    switch (pointType) {
      case "16":
        return 8;
      case "21":
        return 10;
      case "best4":
        return 2;
      case "best5":
        return 2;
      default:
        return 10;
    }
  };

  const multiplier = getCompensationMultiplier(tournament.pointType);

  // Calculate compensation points and final score
  Object.values(stats).forEach((player) => {
    // M+ = (maxMP - playerMP) * multiplier
    player.compensationPoints = (maxMatchesPlayed - player.matchesPlayed) * multiplier;
    // Final score = total match points + compensation
    player.finalScore = player.totalPoints + player.compensationPoints;
  });

  // Sort by final score (highest first), then by wins, then by total points
  return Object.values(stats).sort((a, b) => {
    if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.totalPoints - a.totalPoints;
  });
}
