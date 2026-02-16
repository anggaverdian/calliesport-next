"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { CalendarBlankIcon, SpinnerGapIcon, XIcon, UserIcon, CaretRightIcon, ArrowLeftIcon, CheckCircleIcon, XCircleIcon, CircleIcon } from "@phosphor-icons/react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Brand_Logo from "../../../public/calliesport-logo.svg";

interface Match {
  id: string;
  teamA: string[];
  teamB: string[];
  scoreA: number | null;
  scoreB: number | null;
  isCompleted: boolean;
}

interface Round {
  roundNumber: number;
  matches: Match[];
  restingPlayers: string[];
}

interface TournamentData {
  id: string;
  name: string;
  players: string[];
  teamType: string;
  pointType: string;
  rounds: Round[];
  createdAt: string;
  hasExtended?: boolean;
  isEnded?: boolean;
}

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

interface SharePageClientProps {
  shareId: string;
}

type SortType = "points" | "wins";
type RoundResult = 'win' | 'loss' | 'pending';

interface PlayerPairingStats {
  playerName: string;
  partnerCount: number;
  versusCount: number;
  partnerResults: RoundResult[];
  versusResults: RoundResult[];
}

interface RoundInfo {
  round: Round;
  match: Match;
}

function getTeamTypeLabel(teamType: string): string {
  switch (teamType) {
    case "standard": return "Americano";
    case "mix": return "Mix Americano";
    case "team": return "Team Americano";
    case "mexicano": return "Mexicano";
    default: return teamType;
  }
}

function getPointTypeLabel(pointType: string): string {
  switch (pointType) {
    case "21": return "21 points";
    case "16": return "16 points";
    case "best4": return "Best of 4";
    case "best5": return "Best of 5";
    default: return pointType;
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function calculatePlayerStats(tournament: TournamentData): PlayerStats[] {
  const stats: Record<string, PlayerStats> = {};

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

  tournament.rounds.forEach((round) => {
    round.matches.forEach((match) => {
      if (match.isCompleted && match.scoreA !== null && match.scoreB !== null) {
        const isTie = match.scoreA === match.scoreB;
        const teamAWins = match.scoreA > match.scoreB;
        const teamBWins = match.scoreB > match.scoreA;

        match.teamA.forEach((player) => {
          if (!stats[player]) return;
          stats[player].matchesPlayed++;
          stats[player].totalPoints += match.scoreA!;
          if (isTie) stats[player].ties++;
          else if (teamAWins) stats[player].wins++;
          else stats[player].losses++;
        });

        match.teamB.forEach((player) => {
          if (!stats[player]) return;
          stats[player].matchesPlayed++;
          stats[player].totalPoints += match.scoreB!;
          if (isTie) stats[player].ties++;
          else if (teamBWins) stats[player].wins++;
          else stats[player].losses++;
        });
      }
    });
  });

  const maxMatchesPlayed = Math.max(
    ...Object.values(stats).map((s) => s.matchesPlayed)
  );

  const getCompensationMultiplier = (pointType: string): number => {
    switch (pointType) {
      case "16": return 8;
      case "21": return 10;
      case "best4": return 2;
      case "best5": return 2;
      default: return 10;
    }
  };

  const multiplier = getCompensationMultiplier(tournament.pointType);

  Object.values(stats).forEach((player) => {
    player.compensationPoints = (maxMatchesPlayed - player.matchesPlayed) * multiplier;
    player.finalScore = player.totalPoints + player.compensationPoints;
  });

  return Object.values(stats).sort((a, b) => {
    if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.totalPoints - a.totalPoints;
  });
}

export default function SharePageClient({ shareId }: SharePageClientProps) {
  const [tournament, setTournament] = useState<TournamentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortType>("points");
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPairPlayer, setSelectedPairPlayer] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState<"overview" | "matches">("overview");

  useEffect(() => {
    async function fetchTournament() {
      try {
        const response = await fetch(`/api/share/${shareId}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          setError(result.error || "Tournament not found");
          return;
        }

        setTournament(result.tournament);
      } catch {
        setError("Failed to load tournament");
      } finally {
        setIsLoading(false);
      }
    }

    if (shareId) {
      fetchTournament();
    }
  }, [shareId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <SpinnerGapIcon size={32} className="animate-spin text-clx-icon-default" />
          <p className="text-sm text-clx-text-secondary">Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <h2 className="text-lg font-bold text-clx-text-default">Tournament not found</h2>
          <p className="text-sm text-clx-text-secondary">{error || "This share link may be invalid or expired."}</p>
        </div>
      </div>
    );
  }

  const playerStats = calculatePlayerStats(tournament);

  const sortedPlayerStats = [...playerStats].sort((a, b) => {
    if (sortBy === "wins") {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.finalScore - a.finalScore;
    }
    if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.totalPoints - a.totalPoints;
  });

  // Calculate pairing stats for selected player
  const pairingStats = selectedPlayer
    ? calculatePairingStats(tournament, selectedPlayer)
    : [];

  // Get rounds where selectedPlayer partnered with or played versus selectedPairPlayer
  const pairRounds = selectedPlayer && selectedPairPlayer
    ? getRoundsWithPair(tournament, selectedPlayer, selectedPairPlayer)
    : { partnerRounds: [], versusRounds: [] };

  // Get all rounds for the selected player (for Matches tab)
  const playerRounds = selectedPlayer
    ? getPlayerRounds(tournament, selectedPlayer)
    : [];

  // Get selected player's stats
  const selectedPlayerStats = selectedPlayer
    ? playerStats.find(p => p.name === selectedPlayer)
    : null;

  // Get selected player's rank
  const selectedPlayerRank = selectedPlayer
    ? sortedPlayerStats.findIndex(p => p.name === selectedPlayer) + 1
    : 0;

  const handlePlayerClick = (playerName: string) => {
    setSelectedPlayer(playerName);
    setSelectedPairPlayer(null);
    setDrawerTab("overview");
    setIsDrawerOpen(true);
  };

  const handlePairPlayerClick = (playerName: string) => {
    setSelectedPairPlayer(playerName);
  };

  const handleBackToSummary = () => {
    setSelectedPairPlayer(null);
  };

  const totalRounds = tournament.rounds.length;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[393px] mx-auto pb-12">
        {/* Header */}
        <div className="px-4 pt-[max(16px,env(safe-area-inset-top))] pb-2">
          <div className="flex gap-3 items-center">
            <Image src={Brand_Logo} width={32} height={32} alt="Calliesport" />
            <span className="text-base font-bold text-clx-text-default">Calliesport</span>
          </div>
        </div>

        {/* Tournament info */}
        <div className="px-4 pt-4 pb-2 space-y-1">
          <h1 className="text-xl font-bold text-clx-text-default">{tournament.name}</h1>
          <p className="text-sm text-clx-text-secondary">
            {getTeamTypeLabel(tournament.teamType)}, {tournament.players.length} players, {getPointTypeLabel(tournament.pointType)}
          </p>
          <div className="flex items-center gap-1.5 text-sm text-clx-text-secondary hidden">
            <CalendarBlankIcon size={16} />
            <span>{formatDate(tournament.createdAt)}</span>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="px-4 pt-6 space-y-4">
          {/* Sort controls */}
          <div className="flex items-center w-full justify-between">
            <span className="text-sm font-semibold">Sort by:</span>
            <Tabs
              value={sortBy === "points" ? "SortByPoints" : "SortByWins"}
              onValueChange={(value) => setSortBy(value === "SortByWins" ? "wins" : "points")}
            >
              <TabsList className="bg-clx-bg-neutral-bold">
                <TabsTrigger
                  value="SortByPoints"
                  className={sortBy !== "points" ? "text-clx-text-secondary" : ""}
                >
                  Point
                </TabsTrigger>
                <TabsTrigger
                  value="SortByWins"
                  className={sortBy !== "wins" ? "text-clx-text-secondary" : ""}
                >
                  Wins
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Table */}
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
              {sortedPlayerStats.map((player, index) => {
                const rank = index + 1;
                const isFirstPlace = rank === 1;

                return (
                  <TableRow
                    key={player.name}
                    className={`border-b-1 border-clx-border-subtle ${
                      isFirstPlace
                        ? "bg-amber-300 hover:bg-amber-300"
                        : "bg-clx-bg-neutral-subtle hover:bg-clx-bg-neutral-subtle"
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
                      className="py-3 text-sm font-medium text-clx-text-default cursor-pointer hover:underline"
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
                      {player.compensationPoints > 0 ? `+${player.compensationPoints}` : ""}
                    </TableCell>
                    <TableCell className="py-3 text-center text-xs text-clx-text-default">
                      {player.finalScore}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Legend */}
          <div className="px-2 py-3 bg-clx-bg-neutral-subtle rounded-lg">
            <div className="mb-2 text-xs font-semibold text-clx-text-default">Legend:</div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-clx-text-secondary">
              <span><span className="font-medium text-clx-text-default">MP</span> = Match Played</span>
              <span><span className="font-medium text-clx-text-default">W-L-T</span> = Win, Lost, Tied</span>
              <span><span className="font-medium text-clx-text-default">M+</span> = Point Compensation</span>
              <span><span className="font-medium text-clx-text-default">Pts</span> = Total point</span>
            </div>
          </div>
        </div>

        {/* Round details */}
        <div className="px-4 pt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-clx-text-default">Round details</h2>
            <span className="text-sm text-clx-text-secondary">{totalRounds} rounds</span>
          </div>

          <div className="space-y-3">
            {tournament.rounds.map((round) => (
              <div key={round.roundNumber}>
                {round.matches.map((match) => (
                  <RoundCard
                    key={match.id}
                    roundNumber={round.roundNumber}
                    match={match}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        {/* Player Head to Head Drawer */}
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerContent className="bg-white max-h-[90vh]" showHandle={true}>
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

            {selectedPairPlayer ? (
              // Detail View - Shows rounds with specific pair
              <div className="flex-1 overflow-auto p-4 space-y-8 user-drag-none select-none pb-40 min-h-[80vh] max-h-[80vh]">
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

                {pairRounds.partnerRounds.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-clx-text-default">
                      Partner up <span className="text-sm">🤝</span>
                    </h3>
                    <div className="space-y-2">
                      {pairRounds.partnerRounds.map((roundInfo) => (
                        <DrawerRoundCard
                          key={`partner-${roundInfo.round.roundNumber}`}
                          roundInfo={roundInfo}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {pairRounds.versusRounds.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-clx-text-default">
                      Versus <span className="text-xs">⚔</span>
                    </h3>
                    <div className="space-y-2">
                      {pairRounds.versusRounds.map((roundInfo) => (
                        <DrawerRoundCard
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
              <div className="flex-1 overflow-auto p-4 space-y-4 pb-40 user-drag-none select-none min-h-[80vh] max-h-[80vh]">
                <h3>Head to head overview</h3>
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

                {drawerTab === "overview" ? (
                  <>
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

                    <div className="space-y-2">
                      {playerRounds.length > 0 ? (
                        playerRounds.map((roundInfo) => (
                          <DrawerRoundCard
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
    </div>
  );
}

interface RoundCardProps {
  roundNumber: number;
  match: Match;
}

function calculatePairingStats(
  tournament: TournamentData,
  selectedPlayer: string
): PlayerPairingStats[] {
  const stats: Record<string, PlayerPairingStats> = {};

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

  tournament.rounds.forEach((round) => {
    round.matches.forEach((match) => {
      const teamAPlayers = match.teamA;
      const teamBPlayers = match.teamB;

      const getResult = (isTeamA: boolean): RoundResult => {
        if (!match.isCompleted || match.scoreA === null || match.scoreB === null) {
          return 'pending';
        }
        const playerScore = isTeamA ? match.scoreA : match.scoreB;
        const opponentScore = isTeamA ? match.scoreB : match.scoreA;
        if (playerScore > opponentScore) return 'win';
        return 'loss';
      };

      if (teamAPlayers.includes(selectedPlayer)) {
        const result = getResult(true);
        teamAPlayers.forEach((player) => {
          if (player !== selectedPlayer && stats[player]) {
            stats[player].partnerCount++;
            stats[player].partnerResults.push(result);
          }
        });
        teamBPlayers.forEach((player) => {
          if (stats[player]) {
            stats[player].versusCount++;
            stats[player].versusResults.push(result);
          }
        });
      } else if (teamBPlayers.includes(selectedPlayer)) {
        const result = getResult(false);
        teamBPlayers.forEach((player) => {
          if (player !== selectedPlayer && stats[player]) {
            stats[player].partnerCount++;
            stats[player].partnerResults.push(result);
          }
        });
        teamAPlayers.forEach((player) => {
          if (stats[player]) {
            stats[player].versusCount++;
            stats[player].versusResults.push(result);
          }
        });
      }
    });
  });

  return Object.values(stats).sort((a, b) =>
    a.playerName.localeCompare(b.playerName)
  );
}

function getRoundsWithPair(
  tournament: TournamentData,
  player1: string,
  player2: string
): { partnerRounds: RoundInfo[]; versusRounds: RoundInfo[] } {
  const partnerRounds: RoundInfo[] = [];
  const versusRounds: RoundInfo[] = [];

  tournament.rounds.forEach((round) => {
    round.matches.forEach((match) => {
      const teamAPlayers = match.teamA;
      const teamBPlayers = match.teamB;

      if (teamAPlayers.includes(player1) && teamAPlayers.includes(player2)) {
        partnerRounds.push({ round, match });
      } else if (teamBPlayers.includes(player1) && teamBPlayers.includes(player2)) {
        partnerRounds.push({ round, match });
      } else if (
        (teamAPlayers.includes(player1) && teamBPlayers.includes(player2)) ||
        (teamAPlayers.includes(player2) && teamBPlayers.includes(player1))
      ) {
        versusRounds.push({ round, match });
      }
    });
  });

  return { partnerRounds, versusRounds };
}

function getPlayerRounds(
  tournament: TournamentData,
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

  return playerRounds.sort((a, b) => a.round.roundNumber - b.round.roundNumber);
}

function DrawerRoundCard({ roundInfo }: { roundInfo: RoundInfo }) {
  const { round, match } = roundInfo;
  const scoreA = match.scoreA ?? 0;
  const scoreB = match.scoreB ?? 0;
  const isCompleted = match.isCompleted;
  const teamAWins = scoreA > scoreB;
  const teamBWins = scoreB > scoreA;

  const getPlayerTextClass = (isTeamA: boolean) => {
    if (!isCompleted) return "text-clx-text-default";
    const isWinner = isTeamA ? teamAWins : teamBWins;
    const isTie = scoreA === scoreB;
    if (isTie) return "text-clx-text-default";
    return isWinner ? "text-clx-text-default" : "text-clx-text-disabled";
  };

  const formatScore = (score: number) => score.toString().padStart(2, '0');

  return (
    <div className="bg-white border rounded-lg px-6 py-3 space-y-3">
      <p className="text-sm font-bold text-clx-text-default text-center">
        Round {round.roundNumber}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2 w-[104px]">
          {match.teamA.map((player, idx) => (
            <span key={idx} className={`text-sm ${getPlayerTextClass(true)}`}>
              {player}
            </span>
          ))}
        </div>
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
        <div className="flex flex-col gap-2 w-[104px] items-end">
          {match.teamB.map((player, idx) => (
            <span key={idx} className={`text-sm ${getPlayerTextClass(false)}`}>
              {player}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusSlots({ results }: { results: RoundResult[] }) {
  const totalCount = results.length;

  if (totalCount === 0) {
    return <span className="text-sm text-clx-text-default">-</span>;
  }

  return (
    <div className="items-center">
      <div className="flex flex-wrap gap-0.5 max-w-[80px]">
        {results.map((result, idx) => {
          if (result === 'win') {
            return (
              <CheckCircleIcon key={idx} size={14} weight="fill" className="text-clx-icon-success" />
            );
          } else if (result === 'loss') {
            return (
              <XCircleIcon key={idx} size={14} weight="fill" className="text-clx-icon-danger" />
            );
          } else {
            return (
              <CircleIcon key={idx} size={14} weight="fill" className="text-clx-icon-disabled" />
            );
          }
        })}
      </div>
    </div>
  );
}

function RoundCard({ roundNumber, match }: RoundCardProps) {
  const scoreA = match.scoreA ?? 0;
  const scoreB = match.scoreB ?? 0;
  const isCompleted = match.isCompleted;

  const teamAWins = scoreA > scoreB;
  const teamBWins = scoreB > scoreA;

  const getPlayerTextClass = (isTeamA: boolean) => {
    if (!isCompleted) return "text-clx-text-default";
    const isWinner = isTeamA ? teamAWins : teamBWins;
    const isTie = scoreA === scoreB;
    if (isTie) return "text-clx-text-default";
    return isWinner ? "text-clx-text-default" : "text-clx-text-disabled";
  };

  const formatScore = (score: number) => score.toString().padStart(2, "0");

  return (
    <div className="bg-white border rounded-lg px-6 py-3 space-y-3">
      <p className="text-sm font-bold text-clx-text-default text-center">
        Round {roundNumber}
      </p>

      <div className="flex items-center justify-between">
        {/* Team A */}
        <div className="flex flex-col gap-2 w-[104px]">
          {match.teamA.map((player, idx) => (
            <span key={idx} className={`text-sm ${getPlayerTextClass(true)}`}>
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
            <span key={idx} className={`text-sm ${getPlayerTextClass(false)}`}>
              {player}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
