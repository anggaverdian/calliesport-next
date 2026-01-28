"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon } from "@phosphor-icons/react";
import AppBarTournamentDetail from "@/app/ui_pattern/AppBar/AppBarTournamentDetail";
import { Skeleton } from "@/components/ui/skeleton";
import electricIcon from "../../../public/electric.svg";
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
  getPointTypeLabel,
} from "@/utils/tournament";
import { toast } from "sonner";
import { GenderMale, GenderFemale } from "@phosphor-icons/react";
import { MIX_AMERICANO_TOTAL_ROUNDS } from "@/utils/MixAmericanoTournament";

// Skeleton for ScoreCard loading (includes resting players)
function ScoreCardSkeleton() {
  return (
    <>
      <div className="rounded-2xl border border-neutral-200 p-4 space-y-4">
        {/* Team A */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="w-14 h-12 rounded-lg" />
        </div>
        {/* VS divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-neutral-200" />
          <Skeleton className="h-5 w-8" />
          <div className="flex-1 h-px bg-neutral-200" />
        </div>
        {/* Team B */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="w-14 h-12 rounded-lg" />
        </div>
      </div>
      {/* Resting players skeleton */}
      <div className="flex items-center justify-center gap-2">
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-4 w-32" />
      </div>
    </>
  );
}

// Skeleton for LeaderboardTable loading
function LeaderboardSkeleton() {
  return (
    <div className="space-y-4">
      {/* Table header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-4 w-24 flex-1" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-12" />
      </div>
      {/* Table rows */}
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="h-5 w-6" />
          <Skeleton className="h-5 w-32 flex-1" />
          <Skeleton className="h-5 w-10" />
          <Skeleton className="h-5 w-10" />
        </div>
      ))}
    </div>
  );
}

// Lazy load heavy components
const RoundContent = dynamic(
  () => import("@/app/ui_pattern/TournamentDetailPage/RoundContent"),
  { ssr: false, loading: () => <ScoreCardSkeleton /> }
);
const TournamentBanner = dynamic(
  () => import("@/app/ui_pattern/TournamentDetailPage/TournamentBanner"),
  { ssr: false }
);
const ScoreInputModal = dynamic(
  () => import("@/app/ui_pattern/TournamentDetailPage/ScoreInputModal"),
  { ssr: false }
);
const LeaderboardTable = dynamic(
  () => import("@/app/ui_pattern/TournamentDetailPage/LeaderboardTable"),
  { ssr: false, loading: () => <LeaderboardSkeleton /> }
);
const EditTournamentInfoDrawer = dynamic(
  () => import("@/app/ui_pattern/TournamentDetailPage/EditTournamentInfoDrawer"),
  { ssr: false }
);
const EditPlayersDrawer = dynamic(
  () => import("@/app/ui_pattern/TournamentDetailPage/EditPlayersDrawer"),
  { ssr: false }
);

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
        <div className="flex-1 flex flex-col items-center justify-center p-6 pt-24 text-center">
          <Image src={electricIcon} width={48} height={48} alt="" />
          <div className="rounded-xl p-8 pt-4 max-w-md">
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
      toast.info("Tournament is already completed. Scores cannot be changed.");
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

  const handleResetScore = () => {
    if (!currentRoundData) return;

    const match = currentRoundData.matches[selectedMatchIndex];
    const updatedTournament = updateMatchScore(
      tournament.id,
      currentRound,
      match.id,
      null,
      null
    );

    if (updatedTournament) {
      setTournament(updatedTournament);
      //toast.success("Score reset successfully");
    }
  };

  const isRoundCompleted = currentRoundData?.matches.every(m => m.isCompleted) ?? false;

  // Check if this is a Mix Americano tournament
  const isMixAmericano = tournament.teamType === "mix";

  // Calculate initial rounds count (set 1)
  // For Mix Americano, use the fixed 24 rounds
  const initialRoundsCount = isMixAmericano
    ? MIX_AMERICANO_TOTAL_ROUNDS
    : calculateRounds(tournament.players.length);

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

    // Mix Americano: No extend feature, only end game after all 24 rounds
    if (isMixAmericano) {
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

    // Standard Americano: Set 2 exists
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

  // Handle tournament update from lineup regeneration
  const handleTournamentUpdate = (updatedTournament: Tournament) => {
    setTournament(updatedTournament);
    // Reset to round 1 when lineup is regenerated
    setCurrentRound(1);
    updateUrl(activeTab, 1);
  };

  return (
    <main className="min-w-[393px] w-auto min-h-screen bg-white flex flex-col">
      <AppBarTournamentDetail
        tournament={tournament}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onTournamentUpdate={handleTournamentUpdate}
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
              <RoundContent
                match={currentRoundData.matches[0]}
                restingPlayers={(() => {
                  // For Mix Americano, calculate resting players from match data
                  // since restingPlayers array is always empty
                  let resting = currentRoundData.restingPlayers;
                  if (isMixAmericano && resting.length === 0) {
                    const playingPlayers = new Set([
                      ...currentRoundData.matches[0].teamA,
                      ...currentRoundData.matches[0].teamB,
                    ]);
                    resting = tournament.players.filter(
                      (player) => !playingPlayers.has(player)
                    );
                  }
                  return resting;
                })()}
                onScoreClickA={() => handleScoreClick(0, "A")}
                onScoreClickB={() => handleScoreClick(0, "B")}
              />
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
          <DetailsTab tournament={tournament} onTournamentUpdate={handleTournamentUpdate} />
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
          onReset={handleResetScore}
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
                className="text-clx-text-default border-clx-border-textfield"
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
function DetailsTab({
  tournament,
  onTournamentUpdate
}: {
  tournament: Tournament;
  onTournamentUpdate: (updatedTournament: Tournament) => void;
}) {
  const [isEditInfoOpen, setIsEditInfoOpen] = useState(false);
  const [isEditPlayersOpen, setIsEditPlayersOpen] = useState(false);

  const completedRounds = tournament.rounds.filter(r =>
    r.matches.every(m => m.isCompleted)
  ).length;

  const isMixAmericano = tournament.teamType === "mix";

  // For Mix Americano, separate players by gender
  const menPlayers = isMixAmericano && tournament.playerGenders
    ? tournament.players.filter(p => tournament.playerGenders?.[p] === "male")
    : [];
  const womenPlayers = isMixAmericano && tournament.playerGenders
    ? tournament.players.filter(p => tournament.playerGenders?.[p] === "female")
    : [];

  return (
    <div className="space-y-8">
      {/* Tournament Info Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-clx-text-default">Tournament info</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditInfoOpen(true)}
            className="h-9 px-3 text-sm font-semibold border-clx-border-textfield"
            disabled={tournament.isEnded}
          >
            Edit
          </Button>
        </div>

        <div className="divide-y divide-clx-border-default">
          <div className="flex justify-between py-3 text-sm">
            <span className="text-clx-text-secondary">Name</span>
            <span className="text-clx-text-default">{tournament.name}</span>
          </div>
          <div className="flex justify-between py-3 text-sm">
            <span className="text-clx-text-secondary">Gameplay</span>
            <span className="text-clx-text-default">{teamTypeNames[tournament.teamType]}</span>
          </div>
          <div className="flex justify-between py-3 text-sm">
            <span className="text-clx-text-secondary">Point match</span>
            <span className="text-clx-text-default">{getPointTypeLabel(tournament.pointType)}</span>
          </div>
          <div className="flex justify-between py-3 text-sm">
            <span className="text-clx-text-secondary">Total player</span>
            <span className="text-clx-text-default">{tournament.players.length}</span>
          </div>
          <div className="flex justify-between py-3 text-sm">
            <span className="text-clx-text-secondary">Total round</span>
            <span className="text-clx-text-default">{tournament.rounds.length}</span>
          </div>
          <div className="flex justify-between py-3 text-sm">
            <span className="text-clx-text-secondary">Complete round</span>
            <span className="text-clx-text-default">{completedRounds}</span>
          </div>
        </div>
      </div>

      {/* Players Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-clx-text-default">Players</h3>
            <span className="text-xs text-clx-text-secondary">
              Total <span className="text-clx-text-default">{tournament.players.length} players</span> added
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 text-sm font-semibold border-clx-border-textfield"
            disabled={tournament.isEnded || isMixAmericano}
            onClick={() => setIsEditPlayersOpen(true)}
          >
            Edit
          </Button>
        </div>

        {/* Mix Americano: Show players grouped by gender */}
        {isMixAmericano && tournament.playerGenders ? (
          <div className="space-y-4">
            {/* Men section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="bg-blue-50 px-2 py-1 rounded">
                  <GenderMale size={16} className="text-clx-text-accent" />
                </div>
                <span className="text-sm text-clx-text-default">Men ({menPlayers.length})</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {menPlayers.map((player, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 text-sm bg-clx-bg-neutral-bold rounded text-clx-text-dark-subtle"
                  >
                    {player}
                  </span>
                ))}
              </div>
            </div>

            {/* Women section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="bg-red-50 px-2 py-1 rounded">
                  <GenderFemale size={16} className="text-red-500" />
                </div>
                <span className="text-sm text-clx-text-default">Women ({womenPlayers.length})</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {womenPlayers.map((player, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 text-sm bg-clx-bg-neutral-bold rounded text-clx-text-dark-subtle"
                  >
                    {player}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Standard Americano: Show all players */
          <div className="flex flex-wrap gap-2">
            {tournament.players.map((player, index) => (
              <span
                key={index}
                className="px-3 py-1.5 text-sm bg-clx-bg-neutral-bold rounded text-clx-text-dark-subtle"
              >
                {player}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Edit Tournament Info Drawer */}
      <EditTournamentInfoDrawer
        isOpen={isEditInfoOpen}
        onClose={() => setIsEditInfoOpen(false)}
        tournament={tournament}
        onUpdate={onTournamentUpdate}
      />

      {/* Edit Players Drawer */}
      <EditPlayersDrawer
        isOpen={isEditPlayersOpen}
        onClose={() => setIsEditPlayersOpen(false)}
        tournament={tournament}
        onUpdate={onTournamentUpdate}
      />
    </div>
  );
}
