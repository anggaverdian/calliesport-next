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
import { XIcon, UserIcon, CaretRightIcon, ArrowLeftIcon, CheckCircleIcon, XCircleIcon, CircleIcon } from "@phosphor-icons/react";
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

// Round result type: 'win' | 'loss' | 'pending'
type RoundResult = 'win' | 'loss' | 'pending';

interface PlayerPairingStats {
  playerName: string;
  partnerCount: number;
  versusCount: number;
  partnerResults: RoundResult[]; // Results for each partner round
  versusResults: RoundResult[];  // Results for each versus round
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
  // State for drawer tab
  const [drawerTab, setDrawerTab] = useState<"overview" | "matches">("overview");
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

  // Get all rounds for the selected player (for Player's Matches tab)
  const playerRounds = selectedPlayer
    ? getPlayerRounds(tournament, selectedPlayer)
    : [];

  // Get selected player's stats for the stats bar
  const selectedPlayerStats = selectedPlayer
    ? playerStats.find(p => p.name === selectedPlayer)
    : null;

  // Get selected player's rank
  const selectedPlayerRank = selectedPlayer
    ? sortedPlayerStats.findIndex(p => p.name === selectedPlayer) + 1
    : 0;

  const handlePlayerClick = (playerName: string) => {
    setSelectedPlayer(playerName);
    setSelectedPairPlayer(null); // Reset detail view
    setDrawerTab("overview"); // Reset to overview tab
    setIsDrawerOpen(true);
  };

  const handlePairPlayerClick = (playerName: string) => {
    setSelectedPairPlayer(playerName);
  };

  const handleBackToSummary = () => {
    setSelectedPairPlayer(null);
  };

  return (
    <div className="space-y-4 user-drag-none select-none">
      {/* Leaderboard Sort By */}
      <div className="flex items-center w-full justify-between">
          <div className="w-auto"><span className="text-sm font-semibold">Sort by:</span></div>
          <div>
            <Tabs
              value={sortBy === "points" ? "SortByPoints" : "SortByWins"}
              onValueChange={handleSortChange}
            >
              <TabsList className="bg-clx-bg-neutral-bold">
                <TabsTrigger value="SortByPoints" className={sortBy !== "points" ? "text-clx-text-secondary" : ""}>Points</TabsTrigger>
                <TabsTrigger value="SortByWins" className={sortBy !== "wins" ? "text-clx-text-secondary" : ""}>Wins</TabsTrigger>
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
            <div className="flex-1 overflow-auto p-4 space-y-8 user-drag-none select-none pb-40">
              {/* Header with back button and player names */}
              <div className="flex items-center gap-15">
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
                    Partner up <span className="text-sm">🤝</span>
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
                    Versus <span className="text-xs">⚔</span> 
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
            <div className="flex-1 overflow-auto p-4 space-y-4 pb-40 user-drag-none select-none">
              <h3>Head to head overview</h3>
              {/* Player Name Header */}
              <div className="flex items-center gap-3 border-1 rounded-xl p-3">
                <div className="w-8 h-8 rounded-full bg-clx-bg-primary-surface flex items-center justify-center">
                  <UserIcon size={16} weight="fill" className="text-clx-icon-primary" />
                </div>
                <span className="text-lg font-medium text-clx-text-default">
                  {selectedPlayer}
                </span>
              </div>

              <div className="w-auto">
                <Tabs
                  value={drawerTab === "overview" ? "PlayerOverview" : "PlayerMatches"}
                  onValueChange={(value) => setDrawerTab(value === "PlayerOverview" ? "overview" : "matches")}
                >
                    <TabsList className="bg-clx-bg-neutral-bold">
                      <TabsTrigger
                        value="PlayerOverview"
                        className={drawerTab !== "overview" ? "text-clx-text-secondary" : ""}
                      >
                        Overview
                      </TabsTrigger>
                      <TabsTrigger
                        value="PlayerMatches"
                        className={drawerTab !== "matches" ? "text-clx-text-secondary" : ""}
                      >
                        Matches
                      </TabsTrigger>
                    </TabsList>
                </Tabs>
              </div>

              {/* Tab Content */}
              {drawerTab === "overview" ? (
                <>
                  {/* Overview Tab - Pairing Stats Table */}
                  <div className="space-y-2">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-clx-border-subtle hover:bg-transparent">
                          <TableHead className="text-sm font-normal text-clx-text-secondary py-4 px-4">
                            Player
                          </TableHead>
                          <TableHead className="text-sm font-normal text-clx-text-secondary py-4 px-2 w-[100px]">
                           Partner <span className="text-sm">🤝</span>
                          </TableHead>
                          <TableHead className="text-sm font-normal text-clx-text-secondary py-4 px-2 w-[100px]">
                            Versus <span className="text-xs">⚔</span>
                          </TableHead>
                          <TableHead className="w-10" />
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
                            <TableCell className="py-4 px-2 w-[100px]">
                              <StatusSlots results={stat.partnerResults} />
                            </TableCell>
                            <TableCell className="py-4 px-2 w-[100px]">
                              <StatusSlots results={stat.versusResults} />
                            </TableCell>
                            <TableCell className="py-4 px-2 w-10 text-right">
                              <CaretRightIcon size={16} className="text-clx-icon-default" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="bg-clx-bg-neutral-subtle p-4 text-xs text-clx-text-secondary rounded-lg">
                      <div className="mb-3 text-clx-text-default font-semibold"><span>Legend:</span></div>
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                              <CheckCircleIcon weight="fill" size={16} className="text-clx-icon-success" /> <span>You won at that round.</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <XCircleIcon weight="fill" size={16} className="text-clx-icon-danger" /> <span>You lost at that round.</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <CircleIcon weight="fill" size={16} className="text-clx-icon-disabled" /> <span>{selectedPlayer}&apos;s scheduled round</span>
                          </div>
                        </div>
                      </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Player's Matches Tab - Stats Bar and Round Cards */}
                  {/* Stats Bar */}
                  {selectedPlayerStats && (
                    <div className="flex gap-2">
                      <div className="flex-1 bg-clx-bg-neutral-subtle border border-clx-border-default rounded-lg px-3 py-1 text-center">
                        <p className="text-sm text-clx-text-secondary">Rank</p>
                        <p className="text-sm font-semibold text-clx-text-default">
                          {selectedPlayerRank === 1 ? "1st" : selectedPlayerRank === 2 ? "2nd" : selectedPlayerRank === 3 ? "3rd" : `${selectedPlayerRank}th`}
                        </p>
                      </div>
                      <div className="flex-1 bg-clx-bg-neutral-subtle border border-clx-border-default rounded-lg px-3 py-1 text-center">
                        <p className="text-sm text-clx-text-secondary">Mp</p>
                        <p className="text-sm font-semibold text-clx-text-default">{selectedPlayerStats.matchesPlayed}</p>
                      </div>
                      <div className="flex-1 bg-clx-bg-neutral-subtle border border-clx-border-default rounded-lg px-3 py-1 text-center">
                        <p className="text-sm text-clx-text-secondary">W-L-T</p>
                        <p className="text-sm font-semibold text-clx-text-default">
                          {selectedPlayerStats.wins}-{selectedPlayerStats.losses}-{selectedPlayerStats.ties}
                        </p>
                      </div>
                      <div className="flex-1 bg-clx-bg-neutral-subtle border border-clx-border-default rounded-lg px-3 py-1 text-center">
                        <p className="text-sm text-clx-text-secondary">Pts</p>
                        <p className="text-sm font-semibold text-clx-text-default">{selectedPlayerStats.finalScore}</p>
                      </div>
                    </div>
                  )}

                  {/* Round Cards */}
                  <div className="space-y-2">
                    {playerRounds.length > 0 ? (
                      playerRounds.map((roundInfo) => (
                        <RoundCard
                          key={`player-round-${roundInfo.round.roundNumber}`}
                          roundInfo={roundInfo}
                        />
                      ))
                    ) : (
                      <p className="text-sm text-clx-text-secondary text-center py-4">
                        No matches found for {selectedPlayer}
                      </p>
                    )}
                  </div>
                </>
              )}
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
        partnerResults: [],
        versusResults: [],
      };
    }
  });

  // Calculate partner and versus counts from all matches
  tournament.rounds.forEach((round) => {
    round.matches.forEach((match) => {
      const teamAPlayers = match.teamA;
      const teamBPlayers = match.teamB;

      // Determine round result for selectedPlayer's team
      const getResult = (isTeamA: boolean): RoundResult => {
        if (!match.isCompleted || match.scoreA === null || match.scoreB === null) {
          return 'pending';
        }
        const playerScore = isTeamA ? match.scoreA : match.scoreB;
        const opponentScore = isTeamA ? match.scoreB : match.scoreA;
        if (playerScore > opponentScore) return 'win';
        return 'loss';
      };

      // Check if selected player is in Team A
      if (teamAPlayers.includes(selectedPlayer)) {
        const result = getResult(true);
        // Partner is the other player in Team A
        teamAPlayers.forEach((player) => {
          if (player !== selectedPlayer && stats[player]) {
            stats[player].partnerCount++;
            stats[player].partnerResults.push(result);
          }
        });
        // Opponents are players in Team B
        teamBPlayers.forEach((player) => {
          if (stats[player]) {
            stats[player].versusCount++;
            stats[player].versusResults.push(result);
          }
        });
      }
      // Check if selected player is in Team B
      else if (teamBPlayers.includes(selectedPlayer)) {
        const result = getResult(false);
        // Partner is the other player in Team B
        teamBPlayers.forEach((player) => {
          if (player !== selectedPlayer && stats[player]) {
            stats[player].partnerCount++;
            stats[player].partnerResults.push(result);
          }
        });
        // Opponents are players in Team A
        teamAPlayers.forEach((player) => {
          if (stats[player]) {
            stats[player].versusCount++;
            stats[player].versusResults.push(result);
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

// Get all rounds where a player participated
function getPlayerRounds(
  tournament: Tournament,
  playerName: string
): RoundInfo[] {
  const playerRounds: RoundInfo[] = [];

  tournament.rounds.forEach((round) => {
    round.matches.forEach((match) => {
      if (match.teamA.includes(playerName) || match.teamB.includes(playerName)) {
        playerRounds.push({ round, match });
      }
    });
  });

  // Sort by round number
  return playerRounds.sort((a, b) => a.round.roundNumber - b.round.roundNumber);
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
    <div className="bg-white border rounded-lg px-6 py-3 space-y-3">
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

// StatusSlots component props
interface StatusSlotsProps {
  results: RoundResult[];
}

// StatusSlots component to display round result icons with count
function StatusSlots({ results }: StatusSlotsProps) {
  const completedCount = results.filter(r => r !== 'pending').length;
  const totalCount = results.length;

  if (totalCount === 0) {
    return <span className="text-sm text-clx-text-default">-</span>;
  }

  return (
    <div className="items-center">
      {/* Count label */}
      <div className="mb-1 hidden">
        <span className="text-[12px] text-clx-text-default whitespace-nowrap">
          {completedCount} <span className="text-clx-text-placeholder">of</span> {totalCount}
        </span>
      </div>
      {/* Icons container - max 4 per row, wraps */}
      <div className="flex flex-wrap gap-0.5 max-w-[80px]">
        {results.map((result, idx) => {
          if (result === 'win') {
            return (
              <CheckCircleIcon
                key={idx}
                size={14}
                weight="fill"
                className="text-clx-icon-success"
              />
            );
          } else if (result === 'loss') {
            return (
              <XCircleIcon
                key={idx}
                size={14}
                weight="fill"
                className="text-clx-icon-danger"
              />
            );
          } else {
            return (
              <CircleIcon
                key={idx}
                size={14}
                weight="fill"
                className="text-clx-icon-disabled"
              />
            );
          }
        })}
      </div>
    </div>
  );
}
