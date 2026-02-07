"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { CalendarBlankIcon, SpinnerGapIcon } from "@phosphor-icons/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  const totalRounds = tournament.rounds.length;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[393px] mx-auto pb-12">
        {/* Header */}
        <div className="px-4 pt-4 pb-2">
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
          <div className="flex items-center gap-1.5 text-sm text-clx-text-secondary">
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
                    <TableCell className="py-3 text-sm font-medium text-clx-text-default">
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
      </div>
    </div>
  );
}

interface RoundCardProps {
  roundNumber: number;
  match: Match;
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
