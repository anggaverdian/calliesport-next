"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { X, User } from "lucide-react";
import { Tournament } from "@/utils/tournament";

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

interface PlayerPairingStats {
  playerName: string;
  partnerCount: number;
  versusCount: number;
}

interface LeaderboardTableProps {
  tournament: Tournament;
}

export default function LeaderboardTable({ tournament }: LeaderboardTableProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Calculate player statistics
  const playerStats = calculatePlayerStats(tournament);

  // Calculate pairing stats for selected player
  const pairingStats = selectedPlayer
    ? calculatePairingStats(tournament, selectedPlayer)
    : [];

  const handlePlayerClick = (playerName: string) => {
    setSelectedPlayer(playerName);
    setIsDrawerOpen(true);
  };

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
                  } cursor-pointer hover:underline`}
                  onClick={() => handlePlayerClick(player.name)}
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

      {/* Player Summary Drawer */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="bg-white max-h-[85vh]">
          <DrawerHeader className="bg-clx-bg-neutral-subtle border-b border-clx-border-subtle px-4 py-3">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-base font-bold text-clx-text-default">
                Player summary
              </DrawerTitle>
              <DrawerClose className="text-clx-text-secondary hover:text-clx-text-default">
                <X className="h-6 w-6" />
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-auto p-4 space-y-6">
            {/* Player Name Header */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-clx-bg-primary-surface flex items-center justify-center">
                <User className="w-4 h-4 text-clx-primary" />
              </div>
              <span className="text-lg font-bold text-clx-text-default">
                {selectedPlayer}
              </span>
            </div>

            {/* Recap Section */}
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-clx-text-default">
                Recap for {tournament.rounds.length} rounds
              </h3>

              {/* Pairing Stats Table */}
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-clx-border-subtle hover:bg-transparent">
                    <TableHead className="text-sm font-normal text-clx-text-secondary py-4 px-4">
                      Player
                    </TableHead>
                    <TableHead className="text-sm font-normal text-clx-text-secondary py-4 px-2 w-[100px]">
                      Partner up
                    </TableHead>
                    <TableHead className="text-sm font-normal text-clx-text-secondary py-4 px-2 w-[100px]">
                      Versus
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pairingStats.map((stat) => (
                    <TableRow
                      key={stat.playerName}
                      className="border-b border-clx-border-subtle bg-white hover:bg-clx-bg-neutral-hover"
                    >
                      <TableCell className="py-4 px-4 text-sm font-medium text-clx-text-default">
                        {stat.playerName}
                      </TableCell>
                      <TableCell className="py-4 px-2 text-sm text-clx-text-default">
                        {stat.partnerCount > 0 ? `${stat.partnerCount}x` : "-"}
                      </TableCell>
                      <TableCell className="py-4 px-2 text-sm text-clx-text-default">
                        {stat.versusCount > 0 ? `${stat.versusCount}x` : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
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
      if (match.isCompleted && match.scoreA !== null && match.scoreB !== null) {
        const isTie = match.scoreA === match.scoreB;
        const teamAWins = match.scoreA > match.scoreB;
        const teamBWins = match.scoreB > match.scoreA;

        // Update Team A players
        match.teamA.forEach((player) => {
          stats[player].matchesPlayed++;
          stats[player].totalPoints += match.scoreA!;

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
          stats[player].totalPoints += match.scoreB!;

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

function calculatePairingStats(
  tournament: Tournament,
  selectedPlayer: string
): PlayerPairingStats[] {
  const stats: Record<string, PlayerPairingStats> = {};

  // Initialize stats for all other players
  tournament.players.forEach((player) => {
    if (player !== selectedPlayer) {
      stats[player] = {
        playerName: player,
        partnerCount: 0,
        versusCount: 0,
      };
    }
  });

  // Calculate partner and versus counts from all matches
  tournament.rounds.forEach((round) => {
    round.matches.forEach((match) => {
      const teamAPlayers = match.teamA;
      const teamBPlayers = match.teamB;

      // Check if selected player is in Team A
      if (teamAPlayers.includes(selectedPlayer)) {
        // Partner is the other player in Team A
        teamAPlayers.forEach((player) => {
          if (player !== selectedPlayer && stats[player]) {
            stats[player].partnerCount++;
          }
        });
        // Opponents are players in Team B
        teamBPlayers.forEach((player) => {
          if (stats[player]) {
            stats[player].versusCount++;
          }
        });
      }
      // Check if selected player is in Team B
      else if (teamBPlayers.includes(selectedPlayer)) {
        // Partner is the other player in Team B
        teamBPlayers.forEach((player) => {
          if (player !== selectedPlayer && stats[player]) {
            stats[player].partnerCount++;
          }
        });
        // Opponents are players in Team A
        teamAPlayers.forEach((player) => {
          if (stats[player]) {
            stats[player].versusCount++;
          }
        });
      }
    });
  });

  // Return sorted by player name
  return Object.values(stats).sort((a, b) =>
    a.playerName.localeCompare(b.playerName)
  );
}
