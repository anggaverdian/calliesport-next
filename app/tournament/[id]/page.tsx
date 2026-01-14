"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon } from "@phosphor-icons/react";
import AppBarTournamentDetail from "@/app/ui_pattern/AppBar/AppBarTournamentDetail";
import ScoreCard from "@/app/ui_pattern/TournamentDetailPage/ScoreCard";
import ScoreInputModal from "@/app/ui_pattern/TournamentDetailPage/ScoreInputModal";
import LeaderboardTable from "@/app/ui_pattern/TournamentDetailPage/LeaderboardTable";
import TournamentBanner from "@/app/ui_pattern/TournamentDetailPage/TournamentBanner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Tournament,
  getTournamentById,
  updateMatchScore,
  getMaxScore,
  extendTournament,
  endTournament,
  calculateRounds,
  isTeamTypeSupported,
  teamTypeNames,
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
  const [isSkippedRoundsModalOpen, setIsSkippedRoundsModalOpen] = useState(false);

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

  // Show "under development" message for unsupported team types
  if (!isTeamTypeSupported(tournament.teamType)) {
    return (
      <main className="w-auto bg-white flex flex-col">
        <AppBarTournamentDetail
          tournament={tournament}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="rounded-xl p-8 max-w-md">
            <h2 className="text-xl font-semibold text-clx-text-default mb-1">
              Coming Soon
            </h2>
            <p className="text-clx-text-secondary mb-6 text-sm">
              {teamTypeNames[tournament.teamType]} is currently under development.
              Right now, you can only use <span className="font-medium text-clx-text-accent">Standard Americano</span> for tournaments.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
            >
              Back to Home
            </Button>
          </div>
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
    // Prevent score input if tournament is ended
    if (tournament.isEnded) {
      toast.error("Tournament is already completed. Scores cannot be changed.");
      return;
    }
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

  // Calculate initial rounds count (set 1)
  const initialRoundsCount = calculateRounds(tournament.players.length);

  // Check if ALL initial rounds (set 1) are completed
  const set1Rounds = tournament.rounds.slice(0, initialRoundsCount);
  const allSet1RoundsCompleted = set1Rounds.length > 0 && set1Rounds.every(r => r.matches.every(m => m.isCompleted));

  // Check if ALL rounds (including extended set 2) are completed
  const allRoundsCompleted = tournament.rounds.length > 0 && tournament.rounds.every(r => r.matches.every(m => m.isCompleted));

  // Find skipped (incomplete) rounds in set 1
  const getSkippedRoundsInSet1 = () => {
    return set1Rounds
      .filter(r => !r.matches.every(m => m.isCompleted))
      .map(r => r.roundNumber);
  };

  // Find skipped (incomplete) rounds in all rounds
  const getSkippedRounds = () => {
    return tournament.rounds
      .filter(r => !r.matches.every(m => m.isCompleted))
      .map(r => r.roundNumber);
  };

  // Check if last round of current set is completed
  const lastRoundData = tournament.rounds.find(r => r.roundNumber === totalRounds);
  const isLastRoundInputted = lastRoundData?.matches.every(m => m.isCompleted) ?? false;

  // Check if last round of set 1 is inputted
  const lastSet1RoundData = set1Rounds.length > 0 ? set1Rounds[set1Rounds.length - 1] : undefined;
  const isLastSet1RoundInputted = lastSet1RoundData?.matches.every(m => m.isCompleted) ?? false;

  // Determine banner type to show
  const getBannerType = (): "warning" | "addRound" | "endGame" | "completeTournament" | null => {
    // Tournament already ended - show complete banner
    if (tournament.isEnded) {
      return "completeTournament";
    }

    // Set 2 exists
    if (tournament.hasExtended) {
      // All rounds completed - show end game banner
      if (allRoundsCompleted) {
        return "endGame";
      }
      // Last round is inputted but there are skipped rounds - show warning banner
      if (isLastRoundInputted && !allRoundsCompleted) {
        return "warning";
      }
      return null;
    }

    // Set 1 only (not extended yet)
    // Set 1 is complete (all rounds) - show add round banner
    if (allSet1RoundsCompleted) {
      return "addRound";
    }

    // Last round of set 1 is inputted but there are skipped rounds - show warning banner
    if (isLastSet1RoundInputted && !allSet1RoundsCompleted) {
      return "warning";
    }

    return null;
  };

  const bannerType = getBannerType();
  const skippedRounds = tournament.hasExtended ? getSkippedRounds() : getSkippedRoundsInSet1();

  // Handle extending tournament with more rounds
  const handleAddMoreRounds = () => {
    const updatedTournament = extendTournament(tournament.id);
    if (updatedTournament) {
      setTournament(updatedTournament);
      // Navigate to the first new round
      const newRound = initialRoundsCount + 1;
      setCurrentRound(newRound);
      updateUrl(activeTab, newRound);
      toast.success("Additional rounds have been added!");
    }
  };

  // Handle ending the tournament
  const handleEndGame = () => {
    const updatedTournament = endTournament(tournament.id);
    if (updatedTournament) {
      setTournament(updatedTournament);
      toast.success("Tournament completed!");
    }
  };

  // Navigate to a specific round (used when clicking on skipped round in modal)
  const handleGoToRound = (roundNumber: number) => {
    setCurrentRound(roundNumber);
    updateUrl(activeTab, roundNumber);
    setIsSkippedRoundsModalOpen(false);
  };

  return (
    <main className="w-auto min-h-screen bg-white flex flex-col">
      <AppBarTournamentDetail
        tournament={tournament}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {activeTab === "round" && (
        <>
          {/* Tournament Banners - only show on Round tab */}
          {bannerType && (
            <TournamentBanner
              type={bannerType}
              skippedRoundsCount={skippedRounds.length}
              onViewClick={() => setIsSkippedRoundsModalOpen(true)}
              onAddRoundClick={handleAddMoreRounds}
              onEndGameClick={handleEndGame}
            />
          )}
        <div className="flex-1 p-4 space-y-4">
          {/* Round navigation */}
          <div className="flex items-center justify-between px-3">
            {/* Previous button */}
            <button
              type="button"
              onClick={handlePreviousRound}
              disabled={currentRound === 1}
              className="p-2 border border-clx-border-textfield rounded-lg disabled:opacity-0 active:bg-neutral-200"
            >
              <ArrowLeftIcon size={20} className="text-clx-text-secondary" />
            </button>

            {/* Round indicator */}
            <div className="flex items-center gap-2 pl-5 pr-3 py-2 border border-clx-border-textfield rounded-full bg-white">
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
              className="p-2 border border-clx-border-textfield rounded-lg disabled:opacity-0 active:bg-neutral-200"
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
        </>
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

      {/* Skipped Rounds Modal */}
      <Dialog open={isSkippedRoundsModalOpen} onOpenChange={setIsSkippedRoundsModalOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Complete All Rounds</DialogTitle>
            <DialogDescription>
              {tournament.hasExtended
                ? "You need to complete all rounds before ending the game. The following rounds are incomplete:"
                : "You need to complete all rounds before adding more rounds. The following rounds are incomplete:"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 py-2">
            {skippedRounds.map((roundNumber: number) => (
              <Button
                key={roundNumber}
                variant="outline"
                size="sm"
                onClick={() => handleGoToRound(roundNumber)}
                className="text-clx-text-accent border-clx-border-textfield"
              >
                Round {roundNumber}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setIsSkippedRoundsModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
