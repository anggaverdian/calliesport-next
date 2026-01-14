"use client";

import Image from "next/image";
import Link from "next/link";
import { DotsThreeOutlineVerticalIcon, UsersFourIcon, CheckCircleIcon, TrashIcon, PencilSimpleIcon, XIcon } from "@phosphor-icons/react";
import back_button from "../../../public/arrow_Left.svg";
import { Tournament, teamTypeNames, TeamType, regenerateTournamentWithFirstMatch, endTournament, deleteTournament } from "@/utils/tournament";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { toast } from "sonner";

// SVG imports for team type icons
import thunderIcon from "../../../public/thunder.svg";
import chartIcon from "../../../public/Chart.svg";
import upIcon from "../../../public/Up.svg";
import starIcon from "../../../public/Star.svg";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Team type icon mapping
const teamTypeIcons: Record<TeamType, string> = {
  standard: thunderIcon,
  mix: chartIcon,
  team: upIcon,
  mexicano: starIcon,
};

interface AppBarTournamentDetailProps {
  tournament: Tournament;
  activeTab: "round" | "ranking" | "details";
  onTabChange: (tab: "round" | "ranking" | "details") => void;
  onTournamentUpdate?: (tournament: Tournament) => void;
}

export default function AppBarTournamentDetail({
  tournament,
  activeTab,
  onTabChange,
  onTournamentUpdate,
}: AppBarTournamentDetailProps) {
  const router = useRouter();
  const icon = teamTypeIcons[tournament.teamType];
  const pointLabel = tournament.pointType === "21" ? "21 points" :
                     tournament.pointType === "16" ? "16 points" :
                     tournament.pointType === "best4" ? "Best of 4" : "Best of 5";
  const teamTypeLabel = tournament.teamType === "standard" ? "Americano" :
                     tournament.teamType === "mix" ? "Mix Americano" :
                     tournament.teamType === "team" ? "Team Americano" : "Mexicano";
  const [showEditLineup, setShowEditLineup] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerateProgress, setRegenerateProgress] = useState(0);

  // Confirmation modals state
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Lineup selection state
  const [playerA1, setPlayerA1] = useState<string>("");
  const [playerA2, setPlayerA2] = useState<string>("");
  const [playerB1, setPlayerB1] = useState<string>("");
  const [playerB2, setPlayerB2] = useState<string>("");

  // Get selected players to filter out from other selects
  const selectedPlayers = [playerA1, playerA2, playerB1, playerB2].filter(Boolean);

  // Get available players for each slot
  const getAvailablePlayers = (currentValue: string) => {
    return tournament.players.filter(
      player => player === currentValue || !selectedPlayers.includes(player)
    );
  };

  // Check if all 4 players are selected
  const isLineupComplete = playerA1 && playerA2 && playerB1 && playerB2;

  // Check if any round has been inputted (any match is completed)
  const hasInputtedRounds = tournament.rounds.some(r => r.matches.some(m => m.isCompleted));

  // Check if tournament is completed (ended)
  const isTournamentCompleted = tournament.isEnded === true;

  // Reset lineup selection when drawer opens
  useEffect(() => {
    if (showEditLineup) {
      setPlayerA1("");
      setPlayerA2("");
      setPlayerB1("");
      setPlayerB2("");
      setIsRegenerating(false);
      setRegenerateProgress(0);
    }
  }, [showEditLineup]);

  // Handle adjust lineup click - show confirmation if rounds are inputted
  const handleAdjustLineupClick = () => {
    if (hasInputtedRounds) {
      setShowResetConfirmation(true);
    } else {
      setShowEditLineup(true);
    }
  };

  // Handle confirmation to reset and adjust lineup
  const handleConfirmReset = () => {
    setShowResetConfirmation(false);
    setShowEditLineup(true);
  };

  // Handle end tournament
  const handleEndTournament = () => {
    const updatedTournament = endTournament(tournament.id);
    if (updatedTournament && onTournamentUpdate) {
      onTournamentUpdate(updatedTournament);
      toast.success("Tournament ended");
    }
    setShowEndConfirmation(false);
  };

  // Handle delete tournament
  const handleDeleteTournament = () => {
    deleteTournament(tournament.id);
    toast.success("Tournament deleted");
    router.push("/");
  };

  // Handle proceed button click
  const handleProceed = async () => {
    if (!isLineupComplete) return;

    setIsRegenerating(true);
    setRegenerateProgress(0);

    // Simulate progress animation
    const progressInterval = setInterval(() => {
      setRegenerateProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);

    // Small delay to show progress bar animation
    await new Promise(resolve => setTimeout(resolve, 800));

    // Regenerate tournament with selected lineup
    const updatedTournament = regenerateTournamentWithFirstMatch(
      tournament.id,
      [playerA1, playerA2] as [string, string],
      [playerB1, playerB2] as [string, string]
    );

    clearInterval(progressInterval);
    setRegenerateProgress(100);

    // Small delay to show 100% completion
    await new Promise(resolve => setTimeout(resolve, 200));

    if (updatedTournament && onTournamentUpdate) {
      onTournamentUpdate(updatedTournament);
      toast.success("New lineup generated");
    } else {
      toast.error("Failed to regenerate lineup");
    }

    setShowEditLineup(false);
    setIsRegenerating(false);
  };

  return (
    <nav className="w-full bg-white border-b border-clx-border-default sticky top-0 z-50 bg-white">
      {/* Back button */}
      <div className="flex flex-col gap-4 px-4 pt-2 pb-2">


        {/* Tournament info */}
        <div className="flex items-center gap-4 pt-2">
          <Link href="/" className="w-fit">
            <Image src={back_button} width={24} height={24} alt="Back" />
          </Link>
          <div className="shrink-0">
            <Image
              src={icon}
              width={32}
              height={32}
              alt={teamTypeNames[tournament.teamType]}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-clx-text-default truncate">
              {tournament.name}
            </h2>
            <p className="text-xs text-clx-text-secondary">
            {teamTypeLabel}, {tournament.players.length} Players, {pointLabel}
            </p>
          </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 data-[state=open]:bg-clx-bg-neutral-hover"
                    aria-label="Tournament settings"
                  >
                    <DotsThreeOutlineVerticalIcon size={20} weight="fill" className="text-clx-icon-default" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 pb-3" align="end">
                  <DropdownMenuLabel className="font-semibold">Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={handleAdjustLineupClick}
                    className="py-2 active:bg-neutral-200"
                    disabled={isTournamentCompleted}
                  >
                    <UsersFourIcon size={24} className={isTournamentCompleted ? "text-clx-icon-disabled" : "text-clx-icon-default"} />
                    Adjust lineup
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="py-2 active:bg-neutral-200"
                    disabled={isTournamentCompleted}
                  >
                    <PencilSimpleIcon size={24} className={isTournamentCompleted ? "text-clx-icon-disabled" : "text-clx-icon-default"} />
                    Edit tournament
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setShowEndConfirmation(true)}
                    className="py-2 active:bg-neutral-200"
                    disabled={isTournamentCompleted}
                  >
                    <CheckCircleIcon size={24} className={isTournamentCompleted ? "text-clx-icon-disabled" : "text-clx-icon-default"} />
                    End tournament
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setShowDeleteConfirmation(true)}
                    className="py-2 text-clx-icon-danger active:bg-red-50 hover:text-clx-text-danger!"
                  >
                    <TrashIcon size={24} className="text-clx-text-danger" />
                    Delete
                  </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      {/* Tab navigation */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          onTabChange(value as "round" | "ranking" | "details");
          // Scroll to top when tab changes
          window.scrollTo({ top: 0, behavior: "instant" });
        }}
        className="px-4 pt-4 pb-3"
      >
        <TabsList className="w-full bg-transparent p-0 h-auto gap-2 tracking-tight">
          <TabsTrigger
            value="round"
            className="flex-1 h-8 px-4 rounded-lg text-sm border-0 shadow-none data-[state=active]:bg-clx-bg-accent data-[state=active]:text-white data-[state=active]:font-medium data-[state=inactive]:bg-clx-bg-neutral-bold data-[state=inactive]:text-clx-text-default"
          >
            Rounds
          </TabsTrigger>
          <TabsTrigger
            value="ranking"
            className="flex-1 h-8 px-4 rounded-lg text-sm border-0 shadow-none data-[state=active]:bg-clx-bg-accent data-[state=active]:text-white data-[state=active]:font-medium data-[state=inactive]:bg-clx-bg-neutral-bold data-[state=inactive]:text-clx-text-default"
          >
            Leaderboard
          </TabsTrigger>
          <TabsTrigger
            value="details"
            className="flex-1 h-8 px-4 rounded-lg text-sm border-0 shadow-none data-[state=active]:bg-clx-bg-accent data-[state=active]:text-white data-[state=active]:font-medium data-[state=inactive]:bg-clx-bg-neutral-bold data-[state=inactive]:text-clx-text-default"
          >
            Details
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Drawer open={showEditLineup} onOpenChange={setShowEditLineup}>
          <DrawerContent className="h-full max-h-screen rounded-none!" showHandle={false}>
          <DrawerHeader className="bg-clx-bg-neutral-subtle border-b border-clx-border-default px-4 pb-2 pt-3 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DrawerTitle className="text-lg font-bold text-clx-text-default">
                    Adjust lineup
                  </DrawerTitle>
                </div>
                <DrawerClose asChild>
                  <Button variant="ghost" size="icon" aria-label="Close">
                    <XIcon size={24} />
                  </Button>
                </DrawerClose>
              </div>
              <DrawerDescription className="sr-only">
                Select players for the first round lineup
              </DrawerDescription>
            </DrawerHeader>

            {isRegenerating ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
                <div className="w-full max-w-xs space-y-4">
                  <p className="text-center text-sm text-clx-text-secondary">Regenerating rounds...</p>
                  <Progress value={regenerateProgress} aria-label="Regeneration progress" className="[&>div]:bg-blue-500" />
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 p-4 overflow-y-auto">
                  <div className="pb-5 text-sm">
                    <p>You are able to set the first match player. Please select which player you want to select. This setup will apply for the first round.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-full space-y-3">
                      <div><span className="text-base font-bold">Team A</span></div>
                      <Select value={playerA1} onValueChange={setPlayerA1}>
                        <SelectTrigger className="w-full" aria-label="Select Player A1">
                          <SelectValue placeholder="Player A1" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Player name</SelectLabel>
                            {getAvailablePlayers(playerA1).map(player => (
                              <SelectItem key={player} value={player}>{player}</SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <Select value={playerA2} onValueChange={setPlayerA2}>
                        <SelectTrigger className="w-full" aria-label="Select Player A2">
                          <SelectValue placeholder="Player A2" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Player name</SelectLabel>
                            {getAvailablePlayers(playerA2).map(player => (
                              <SelectItem key={player} value={player}>{player}</SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <span className="text-clx-text-secondary">V.S</span>
                    <div className="w-full space-y-3">
                      <div><span className="text-base font-bold">Team B</span></div>
                      <Select value={playerB1} onValueChange={setPlayerB1}>
                        <SelectTrigger className="w-full" aria-label="Select Player B1">
                          <SelectValue placeholder="Player B1" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Player name</SelectLabel>
                            {getAvailablePlayers(playerB1).map(player => (
                              <SelectItem key={player} value={player}>{player}</SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <Select value={playerB2} onValueChange={setPlayerB2}>
                        <SelectTrigger className="w-full" aria-label="Select Player B2">
                          <SelectValue placeholder="Player B2" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Player name</SelectLabel>
                            {getAvailablePlayers(playerB2).map(player => (
                              <SelectItem key={player} value={player}>{player}</SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DrawerFooter>
                  <Button onClick={handleProceed} disabled={!isLineupComplete} className="h-11 disabled:bg-clx-bg-disabled disabled:text-clx-text-disabled">
                    Proceed
                  </Button>
                  <DrawerClose asChild>
                    <Button variant="ghost">Cancel</Button>
                  </DrawerClose>
                </DrawerFooter>
              </>
            )}
          </DrawerContent>
      </Drawer>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetConfirmation} onOpenChange={setShowResetConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset All Rounds?</DialogTitle>
            <DialogDescription>
              You have already inputted scores for some rounds. Adjusting the lineup will reset all rounds back to Set 1 and clear all scores. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowResetConfirmation(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmReset}>
              Reset and Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Tournament Confirmation Dialog */}
      <Dialog open={showEndConfirmation} onOpenChange={setShowEndConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Tournament?</DialogTitle>
            <DialogDescription>
              Are you sure you want to end this tournament? This will mark the tournament as completed and you won&apos;t be able to modify scores anymore.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowEndConfirmation(false)}>
              Cancel
            </Button>
            <Button onClick={handleEndTournament}>
              End Tournament
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Tournament Confirmation Dialog */}
      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tournament?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this tournament? This action cannot be undone and all data will be permanently lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDeleteConfirmation(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTournament}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </nav>
  );
}
