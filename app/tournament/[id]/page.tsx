"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon, DotsThreeIcon, CheckCircleIcon } from "@phosphor-icons/react";
import AppBarTournamentDetail from "@/app/ui_pattern/AppBar/AppBarTournamentDetail";
import ScoreCard from "@/app/ui_pattern/TournamentDetailPage/ScoreCard";
import ScoreInputModal from "@/app/ui_pattern/TournamentDetailPage/ScoreInputModal";
import LeaderboardTable from "@/app/ui_pattern/TournamentDetailPage/LeaderboardTable";
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
  const searchParams = useSearchParams();
  const tournamentId = params.id as string;

  // Get initial values from URL params
  const tabParam = searchParams.get("tab") as "round" | "ranking" | "details" | null;
  const roundParam = searchParams.get("round");

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentRound, setCurrentRound] = useState(roundParam ? parseInt(roundParam, 10) : 1);
  const [activeTab, setActiveTab] = useState<"round" | "ranking" | "details">(tabParam || "round");
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [selectedMatchIndex, setSelectedMatchIndex] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState<"A" | "B">("A");

  // Update URL when tab or round changes
  const updateUrl = (tab: string, round: number) => {
    const newParams = new URLSearchParams();
    newParams.set("tab", tab);
    newParams.set("round", round.toString());
    router.replace(`/tournament/${tournamentId}?${newParams.toString()}`, { scroll: false });
  };

  const handleTabChange = (tab: "round" | "ranking" | "details") => {
    setActiveTab(tab);
    updateUrl(tab, currentRound);
  };

  useEffect(() => {
    const data = getTournamentById(tournamentId);
    if (data) {
      setTournament(data);
      // Validate round number from URL
      if (roundParam) {
        const parsedRound = parseInt(roundParam, 10);
        if (parsedRound >= 1 && parsedRound <= data.rounds.length) {
          setCurrentRound(parsedRound);
        }
      }
    } else {
      toast.error("Tournament not found");
      router.push("/");
    }
    setIsLoading(false);
  }, [tournamentId, router, roundParam]);

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
      const newRound = currentRound - 1;
      setCurrentRound(newRound);
      updateUrl(activeTab, newRound);
    }
  };

  const handleNextRound = () => {
    if (currentRound < totalRounds) {
      const newRound = currentRound + 1;
      setCurrentRound(newRound);
      updateUrl(activeTab, newRound);
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
        onTabChange={handleTabChange}
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
              className="p-2 border border-clx-border-textfield rounded-lg disabled:opacity-30 disabled:cursor-not-allowed active:bg-neutral-200"
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
                weight={isRoundCompleted ? "fill" : "fill"}
                className={isRoundCompleted ? "text-clx-icon-success" : "text-clx-icon-subtle"}
              />
            </div>

            {/* Next button */}
            <button
              type="button"
              onClick={handleNextRound}
              disabled={currentRound === totalRounds}
              className="p-2 border border-clx-border-textfield rounded-lg disabled:opacity-30 disabled:cursor-not-allowed active:bg-neutral-200"
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
          <LeaderboardTable tournament={tournament} />
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
