"use client";

import { useState, useEffect, useRef } from "react";
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
import { XIcon, UserIcon, CaretRightIcon, ArrowLeftIcon } from "@phosphor-icons/react";
import { Tournament, Match, Round } from "@/utils/tournament";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

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

type SortType = "points" | "wins";

export default function LeaderboardTable({ tournament }: LeaderboardTableProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // State for detail view - when user clicks on a player row to see rounds
  const [selectedPairPlayer, setSelectedPairPlayer] = useState<string | null>(null);
  // State for sort type
  const [sortBy, setSortBy] = useState<SortType>("points");
  // State for loading skeleton
  const [isLoading, setIsLoading] = useState(false);
  // Ref to track if this is the initial mount
  const isInitialMount = useRef(true);

  // Calculate player statistics
  const playerStats = calculatePlayerStats(tournament);

  // Sort player stats based on selected sort type
  const sortedPlayerStats = [...playerStats].sort((a, b) => {
    if (sortBy === "wins") {
      // Sort by wins first, then by final score as tiebreaker
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.finalScore - a.finalScore;
    }
    // Default: sort by points (finalScore)
    if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.totalPoints - a.totalPoints;
  });

  // Handle sort change with loading state
  const handleSortChange = (value: string) => {
    const newSortType = value === "SortByWins" ? "wins" : "points";
    if (newSortType !== sortBy) {
      setIsLoading(true);
      setSortBy(newSortType);
    }
  };

  // Effect to handle loading timeout when sort changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Calculate pairing stats for selected player
  const pairingStats = selectedPlayer
    ? calculatePairingStats(tournament, selectedPlayer)
    : [];

  // Get rounds where selectedPlayer partnered with or played versus selectedPairPlayer
  const pairRounds = selectedPlayer && selectedPairPlayer
    ? getRoundsWithPair(tournament, selectedPlayer, selectedPairPlayer)
    : { partnerRounds: [], versusRounds: [] };

  const handlePlayerClick = (playerName: string) => {
    setSelectedPlayer(playerName);
    setSelectedPairPlayer(null); // Reset detail view
    setIsDrawerOpen(true);
  };

  const handlePairPlayerClick = (playerName: string) => {
    setSelectedPairPlayer(playerName);
  };

  const handleBackToSummary = () => {
    setSelectedPairPlayer(null);
  };

  return (
    <div className="space-y-4">
      {/* Leaderboard Sort By */}
      <div className="flex items-center w-full justify-between">
          <div className="w-auto"><span className="text-sm font-semibold">Sort by:</span></div>
          <div>
            <Tabs
              value={sortBy === "points" ? "SortByPoints" : "SortByWins"}
              onValueChange={handleSortChange}
            >
              <TabsList className="bg-clx-bg-neutral-bold">
                <TabsTrigger value="SortByPoints">Points</TabsTrigger>
                <TabsTrigger value="SortByWins">Wins</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
      </div>
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
          {isLoading
            ? // Skeleton loading state
              Array.from({ length: tournament.players.length }).map((_, index) => (
                <TableRow
                  key={`skeleton-${index}`}
                  className="border-b-1 border-clx-border-subtle bg-clx-bg-neutral-subtle"
                >
                  <TableCell className="py-3 text-center">
                    <Skeleton className="h-4 w-4 mx-auto" />
                  </TableCell>
                  <TableCell className="py-3">
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className="py-3">
                    <Skeleton className="h-4 w-6" />
                  </TableCell>
                  <TableCell className="py-3">
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell className="py-3">
                    <Skeleton className="h-4 w-8" />
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <Skeleton className="h-4 w-8 mx-auto" />
                  </TableCell>
                </TableRow>
              ))
            : // Actual data
              sortedPlayerStats.map((player, index) => {
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
                      className={`py-3 text-center text-xs ${
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
        <DrawerContent className="bg-white h-screen" showHandle={true}>
          <DrawerHeader className="border-b border-neutral-100 px-4 pb-3 pt-0 shrink-0 h-0">
            <div className="flex items-center justify-between invisible">
              <DrawerTitle className="text-base font-bold text-clx-text-default">
                Player summary
              </DrawerTitle>
              <DrawerClose className="text-clx-text-secondary hover:text-clx-text-default">
                <XIcon size={24} />
              </DrawerClose>
            </div>
          </DrawerHeader>

          {/* Swap content based on selectedPairPlayer */}
          {selectedPairPlayer ? (
            // Detail View - Shows rounds with specific pair
            <div className="flex-1 overflow-auto p-4 space-y-8 user-drag-none pb-40">
              {/* Header with back button and player names */}
              <div className="flex items-center gap-12">
                <button
                  onClick={handleBackToSummary}
                  className="text-clx-text-secondary hover:text-clx-text-default"
                  aria-label="Back to summary"
                >
                  <ArrowLeftIcon size={24} />
                </button>
                <div><h3>Head to head overview</h3></div>
              </div>

              <div className="flex justify-between">
                  <div className="w-30 text-center border rounded-xl p-3">
                    <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-clx-bg-primary-surface flex items-center justify-center">
                      <UserIcon size={16} weight="fill" className="text-clx-icon-primary" />
                    </div>
                    <span className="block text-base font-medium text-clx-text-default truncate">
                      {selectedPlayer}
                    </span>
                  </div>
                  <div className="w-30 text-center border rounded-xl p-3">
                    <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-clx-bg-primary-surface flex items-center justify-center">
                      <UserIcon size={16} weight="fill" className="text-clx-icon-primary" />
                    </div>
                    <span className="block text-base font-medium text-clx-text-default truncate">
                      {selectedPairPlayer}
                    </span>
                  </div>
              </div>


              {/* Partner up section */}
              {pairRounds.partnerRounds.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-clx-text-default">
                    Partner up on
                  </h3>
                  <div className="space-y-2">
                    {pairRounds.partnerRounds.map((roundInfo) => (
                      <RoundCard
                        key={`partner-${roundInfo.round.roundNumber}`}
                        roundInfo={roundInfo}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Versus section */}
              {pairRounds.versusRounds.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-clx-text-default">
                    Versus on
                  </h3>
                  <div className="space-y-2">
                    {pairRounds.versusRounds.map((roundInfo) => (
                      <RoundCard
                        key={`versus-${roundInfo.round.roundNumber}`}
                        roundInfo={roundInfo}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Summary View - Shows pairing stats table
            <div className="flex-1 overflow-auto p-4 space-y-4">
              <h2>Game summary</h2>
              {/* Player Name Header */}
              <div className="flex items-center gap-3 border-1 rounded-xl p-3">
                <div className="w-8 h-8 rounded-full bg-clx-bg-primary-surface flex items-center justify-center">
                  <UserIcon size={16} weight="fill" className="text-clx-icon-primary" />
                </div>
                <span className="text-lg font-medium text-clx-text-default">
                  {selectedPlayer}
                </span>
              </div>

              {/* Recap Section */}
              <div className="space-y-2">
                {/* Pairing Stats Table */}
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-clx-border-subtle hover:bg-transparent">
                      <TableHead className="text-sm font-normal text-clx-text-secondary py-4 px-4">
                        Player
                      </TableHead>
                      <TableHead className="text-sm font-normal text-clx-text-secondary py-4 px-2 w-[80px]">
                        Partner
                      </TableHead>
                      <TableHead className="text-sm font-normal text-clx-text-secondary py-4 px-2 w-[80px]">
                        Versus
                      </TableHead>
                      <TableHead className="w-8" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pairingStats.map((stat) => (
                      <TableRow
                        key={stat.playerName}
                        className="border-b border-clx-border-subtle bg-white hover:bg-clx-bg-neutral-hover cursor-pointer"
                        onClick={() => handlePairPlayerClick(stat.playerName)}
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
                        <TableCell className="py-4 px-0">
                          <CaretRightIcon size={20} className="text-clx-text-secondary" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
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

// Interface for round info with match details
interface RoundInfo {
  round: Round;
  match: Match;
}

// Interface for pair rounds result
interface PairRoundsResult {
  partnerRounds: RoundInfo[];
  versusRounds: RoundInfo[];
}

// Get rounds where two players partnered or played versus each other
function getRoundsWithPair(
  tournament: Tournament,
  player1: string,
  player2: string
): PairRoundsResult {
  const partnerRounds: RoundInfo[] = [];
  const versusRounds: RoundInfo[] = [];

  tournament.rounds.forEach((round) => {
    round.matches.forEach((match) => {
      const teamAPlayers = match.teamA;
      const teamBPlayers = match.teamB;

      // Check if both players are in Team A (partners)
      if (teamAPlayers.includes(player1) && teamAPlayers.includes(player2)) {
        partnerRounds.push({ round, match });
      }
      // Check if both players are in Team B (partners)
      else if (teamBPlayers.includes(player1) && teamBPlayers.includes(player2)) {
        partnerRounds.push({ round, match });
      }
      // Check if one is in Team A and other in Team B (versus)
      else if (
        (teamAPlayers.includes(player1) && teamBPlayers.includes(player2)) ||
        (teamAPlayers.includes(player2) && teamBPlayers.includes(player1))
      ) {
        versusRounds.push({ round, match });
      }
    });
  });

  return { partnerRounds, versusRounds };
}

// RoundCard component props
interface RoundCardProps {
  roundInfo: RoundInfo;
}

// RoundCard component to display a single round's match
function RoundCard({ roundInfo }: RoundCardProps) {
  const { round, match } = roundInfo;
  const scoreA = match.scoreA ?? 0;
  const scoreB = match.scoreB ?? 0;
  const isCompleted = match.isCompleted;

  // Determine winner for score styling
  const teamAWins = scoreA > scoreB;
  const teamBWins = scoreB > scoreA;

  // Determine text color for player names based on round completion and win/loss
  const getPlayerTextClass = (isTeamA: boolean) => {
    // If round is not completed, all players get dark text
    if (!isCompleted) {
      return "text-clx-text-default";
    }

    // If round is completed, winners get dark text, losers get subtle text
    const isWinner = isTeamA ? teamAWins : teamBWins;
    const isTie = scoreA === scoreB;

    // In case of tie, all players get dark text
    if (isTie) {
      return "text-clx-text-default";
    }

    return isWinner ? "text-clx-text-default" : "text-clx-text-disabled";
  };

  // Format score with leading zero
  const formatScore = (score: number) => score.toString().padStart(2, '0');

  return (
    <div className="bg-clx-bg-neutral-bold rounded-lg px-6 py-3 space-y-3">
      {/* Round number */}
      <p className="text-sm font-bold text-clx-text-default text-center">
        Round {round.roundNumber}
      </p>

      {/* Match content */}
      <div className="flex items-center justify-between">
        {/* Team A */}
        <div className="flex flex-col gap-2 w-[104px]">
          {match.teamA.map((player, idx) => (
            <span
              key={idx}
              className={`text-sm ${getPlayerTextClass(true)}`}
            >
              {player}
            </span>
          ))}
        </div>

        {/* Score */}
        <div className="flex items-center gap-1.5 font-score">
          <div
            className={`w-9 h-8 rounded-md flex items-center justify-center text-base font-medium ${
              isCompleted && teamAWins
                ? "bg-clx-bg-success text-white"
                : "bg-clx-bg-dark text-white"
            }`}
          >
            {formatScore(scoreA)}
          </div>
          <span className="text-clx-text-placeholder font-semibold">:</span>
          <div
            className={`w-9 h-8 rounded-md flex items-center justify-center text-base font-medium ${
              isCompleted && teamBWins
                ? "bg-clx-bg-success text-white"
                : "bg-clx-bg-dark text-white"
            }`}
          >
            {formatScore(scoreB)}
          </div>
        </div>

        {/* Team B */}
        <div className="flex flex-col gap-2 w-[104px] items-end">
          {match.teamB.map((player, idx) => (
            <span
              key={idx}
              className={`text-sm ${getPlayerTextClass(false)}`}
            >
              {player}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
