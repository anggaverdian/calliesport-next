"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon, DotsThreeIcon, CheckCircleIcon } from "@phosphor-icons/react";
import AppBarTournamentDetail from "@/app/ui_pattern/AppBar/AppBarTournamentDetail";
import ScoreCard from "@/app/ui_pattern/TournamentDetailPage/ScoreCard";
import ScoreInputModal from "@/app/ui_pattern/TournamentDetailPage/ScoreInputModal";
import {
  Tournament,
  getTournamentById,
  updateMatchScore,
  getMaxScore,
} from "@/utils/tournament";
import { toast } from "sonner";

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentRound, setCurrentRound] = useState(1);
  const [activeTab, setActiveTab] = useState<"round" | "ranking" | "details">("round");
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [selectedMatchIndex, setSelectedMatchIndex] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState<"A" | "B">("A");

  useEffect(() => {
    const data = getTournamentById(tournamentId);
    if (data) {
      setTournament(data);
    } else {
      toast.error("Tournament not found");
      router.push("/");
    }
    setIsLoading(false);
  }, [tournamentId, router]);

  if (isLoading || !tournament) {
    return (
      <main className="w-auto min-h-screen bg-white">
        <div className="flex items-center justify-center h-screen">
          <p className="text-clx-text-secondary">Loading...</p>
        </div>
      </main>
    );
  }

  const totalRounds = tournament.rounds.length;
  const currentRoundData = tournament.rounds.find(r => r.roundNumber === currentRound);
  const maxScore = getMaxScore(tournament.pointType);

  const handlePreviousRound = () => {
    if (currentRound > 1) {
      setCurrentRound(currentRound - 1);
    }
  };

  const handleNextRound = () => {
    if (currentRound < totalRounds) {
      setCurrentRound(currentRound + 1);
    }
  };

  const handleScoreClick = (matchIndex: number, team: "A" | "B") => {
    setSelectedMatchIndex(matchIndex);
    setSelectedTeam(team);
    setIsScoreModalOpen(true);
  };

  const handleSaveScore = (scoreA: number, scoreB: number) => {
    if (!currentRoundData) return;

    const match = currentRoundData.matches[selectedMatchIndex];
    const updatedTournament = updateMatchScore(
      tournament.id,
      currentRound,
      match.id,
      scoreA,
      scoreB
    );

    if (updatedTournament) {
      setTournament(updatedTournament);
      //toast.success("Score saved!");
    }
  };

  const isRoundCompleted = currentRoundData?.matches.every(m => m.isCompleted) ?? false;

  return (
    <main className="w-auto min-h-screen bg-white flex flex-col">
      <AppBarTournamentDetail
        tournament={tournament}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === "round" && (
        <div className="flex-1 p-4 space-y-4">
          {/* Round navigation */}
          <div className="flex items-center justify-between px-3">
            {/* Previous button */}
            <button
              type="button"
              onClick={handlePreviousRound}
              disabled={currentRound === 1}
              className="p-2 border border-clx-border-textfield rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeftIcon size={20} className="text-clx-text-secondary" />
            </button>

            {/* Round indicator */}
            <div className="flex items-center gap-2 px-5 py-1.5 border border-clx-border-textfield rounded-lg bg-white">
              <span className="text-sm font-bold text-clx-text-default">
                Round {currentRound}
              </span>
              <CheckCircleIcon
                size={20}
                weight={isRoundCompleted ? "fill" : "regular"}
                className={isRoundCompleted ? "text-clx-icon-success" : "text-clx-icon-default"}
              />
            </div>

            {/* Next button */}
            <button
              type="button"
              onClick={handleNextRound}
              disabled={currentRound === totalRounds}
              className="p-2 border border-clx-border-textfield rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowRightIcon size={20} className="text-clx-text-secondary" />
            </button>
          </div>

          {/* Match content */}
          {currentRoundData && currentRoundData.matches.length > 0 && (
            <div className="flex flex-col gap-3 px-2 py-10">


              {/* Score card */}
              <ScoreCard
                match={currentRoundData.matches[0]}
                onScoreClickA={() => handleScoreClick(0, "A")}
                onScoreClickB={() => handleScoreClick(0, "B")}
              />

              {/* Resting players */}
              {currentRoundData.restingPlayers.length > 0 && (
                <div className="flex items-center justify-center gap-1.5 text-sm">
                  <span className="font-semibold text-clx-text-default">Rest:</span>
                  <span className="text-clx-text-secondary">
                    {currentRoundData.restingPlayers.join(", ")}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "ranking" && (
        <div className="flex-1 p-4">
          <RankingTab tournament={tournament} />
        </div>
      )}

      {activeTab === "details" && (
        <div className="flex-1 p-4">
          <DetailsTab tournament={tournament} />
        </div>
      )}

      {/* Score input modal */}
      {currentRoundData && currentRoundData.matches[selectedMatchIndex] && (
        <ScoreInputModal
          isOpen={isScoreModalOpen}
          onClose={() => setIsScoreModalOpen(false)}
          match={currentRoundData.matches[selectedMatchIndex]}
          maxScore={maxScore}
          team={selectedTeam}
          onSave={handleSaveScore}
        />
      )}
    </main>
  );
}

// Ranking Tab Component
function RankingTab({ tournament }: { tournament: Tournament }) {
  // Calculate player rankings based on wins and points
  const playerStats: Record<string, { wins: number; points: number; played: number }> = {};

  tournament.players.forEach(player => {
    playerStats[player] = { wins: 0, points: 0, played: 0 };
  });

  tournament.rounds.forEach(round => {
    round.matches.forEach(match => {
      if (match.isCompleted) {
        // Update stats for Team A
        match.teamA.forEach(player => {
          playerStats[player].played++;
          playerStats[player].points += match.scoreA;
          if (match.scoreA > match.scoreB) {
            playerStats[player].wins++;
          }
        });

        // Update stats for Team B
        match.teamB.forEach(player => {
          playerStats[player].played++;
          playerStats[player].points += match.scoreB;
          if (match.scoreB > match.scoreA) {
            playerStats[player].wins++;
          }
        });
      }
    });
  });

  // Sort by wins, then by points
  const rankings = Object.entries(playerStats)
    .sort((a, b) => {
      if (b[1].wins !== a[1].wins) return b[1].wins - a[1].wins;
      return b[1].points - a[1].points;
    });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-2 py-2 text-sm text-clx-text-secondary">
        <span className="w-8">#</span>
        <span className="flex-1">Player</span>
        <span className="w-12 text-center">W</span>
        <span className="w-12 text-center">Pts</span>
      </div>
      {rankings.map(([player, stats], index) => (
        <div
          key={player}
          className="flex items-center justify-between px-2 py-3 bg-clx-bg-neutral-bold rounded-lg"
        >
          <span className="w-8 text-sm font-semibold text-clx-text-default">{index + 1}</span>
          <span className="flex-1 text-sm font-medium text-clx-text-default">{player}</span>
          <span className="w-12 text-center text-sm text-clx-text-default">{stats.wins}</span>
          <span className="w-12 text-center text-sm text-clx-text-default">{stats.points}</span>
        </div>
      ))}
    </div>
  );
}

// Details Tab Component
function DetailsTab({ tournament }: { tournament: Tournament }) {
  const completedRounds = tournament.rounds.filter(r =>
    r.matches.every(m => m.isCompleted)
  ).length;

  return (
    <div className="space-y-4">
      <div className="bg-clx-bg-neutral-bold rounded-lg p-4 space-y-3">
        <h3 className="text-base font-semibold text-clx-text-default">Tournament Info</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-clx-text-secondary">Name</span>
            <span className="text-clx-text-default font-medium">{tournament.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-clx-text-secondary">Total Players</span>
            <span className="text-clx-text-default font-medium">{tournament.players.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-clx-text-secondary">Total Rounds</span>
            <span className="text-clx-text-default font-medium">{tournament.rounds.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-clx-text-secondary">Completed Rounds</span>
            <span className="text-clx-text-default font-medium">{completedRounds}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-clx-text-secondary">Point Type</span>
            <span className="text-clx-text-default font-medium">
              {tournament.pointType === "21" ? "21 points" :
               tournament.pointType === "16" ? "16 points" :
               tournament.pointType === "best4" ? "Best of 4" : "Best of 5"}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-clx-bg-neutral-bold rounded-lg p-4 space-y-3">
        <h3 className="text-base font-semibold text-clx-text-default">Players</h3>
        <div className="flex flex-wrap gap-2">
          {tournament.players.map((player, index) => (
            <span
              key={index}
              className="px-3 py-1 text-sm bg-white rounded-md text-clx-text-default"
            >
              {player}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
