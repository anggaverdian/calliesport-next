"use client";

import Image from "next/image";
import Link from "next/link";
import { DotsThreeOutlineVerticalIcon, UsersFourIcon, CheckCircleIcon, TrashIcon, PencilSimpleIcon, XIcon, GenderMaleIcon, GenderFemaleIcon, ShareNetworkIcon, WarningIcon } from "@phosphor-icons/react";
import ShareTournamentDrawer from "@/app/ui_pattern/ShareTournamentDrawer/ShareTournamentDrawer";
import back_button from "../../../public/arrow_Left.svg";
import { Tournament, teamTypeNames, TeamType, regenerateTournamentWithFirstMatch, endTournament, deleteTournament } from "@/utils/tournament";
import { regenerateMixAmericanoTournamentWithFirstMatch } from "@/utils/MixAmericanoTournament";
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
import chartIcon from "../../../public/charts.svg";
import upIcon from "../../../public/Up.svg";
import starIcon from "../../../public/Star.svg";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  standard: chartIcon,
  mix: thunderIcon,
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
  const [showShareDrawer, setShowShareDrawer] = useState(false);

  // Lineup selection state - for Mix Americano: A1=Man, A2=Woman, B1=Man, B2=Woman
  const [playerA1, setPlayerA1] = useState<string>("");
  const [playerA2, setPlayerA2] = useState<string>("");
  const [playerB1, setPlayerB1] = useState<string>("");
  const [playerB2, setPlayerB2] = useState<string>("");

  // Check if this is a Mix Americano tournament
  const isMixAmericano = tournament.teamType === "mix";

  // Get selected players to filter out from other selects
  const selectedPlayers = [playerA1, playerA2, playerB1, playerB2].filter(Boolean);

  // Get men and women players for Mix Americano
  const menPlayers = isMixAmericano && tournament.playerGenders
    ? tournament.players.filter(p => tournament.playerGenders?.[p] === "male")
    : [];
  const womenPlayers = isMixAmericano && tournament.playerGenders
    ? tournament.players.filter(p => tournament.playerGenders?.[p] === "female")
    : [];

  // Get available players for each slot (standard mode - any player)
  const getAvailablePlayers = (currentValue: string) => {
    return tournament.players.filter(
      player => player === currentValue || !selectedPlayers.includes(player)
    );
  };

  // Get available men for Mix Americano
  const getAvailableMen = (currentValue: string) => {
    return menPlayers.filter(
      player => player === currentValue || !selectedPlayers.includes(player)
    );
  };

  // Get available women for Mix Americano
  const getAvailableWomen = (currentValue: string) => {
    return womenPlayers.filter(
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

    // Regenerate tournament with selected lineup based on team type
    let updatedTournament;
    if (tournament.teamType === "mix") {
      // Use Mix Americano regenerate function
      updatedTournament = regenerateMixAmericanoTournamentWithFirstMatch(
        tournament.id,
        [playerA1, playerA2] as [string, string],
        [playerB1, playerB2] as [string, string]
      );
    } else {
      // Use Standard Americano regenerate function
      updatedTournament = regenerateTournamentWithFirstMatch(
        tournament.id,
        [playerA1, playerA2] as [string, string],
        [playerB1, playerB2] as [string, string]
      );
    }

    clearInterval(progressInterval);
    setRegenerateProgress(100);

    // Small delay to show 100% completion
    await new Promise(resolve => setTimeout(resolve, 200));

    if (updatedTournament && onTournamentUpdate) {
      onTournamentUpdate(updatedTournament as Tournament);
      toast.success("New lineup generated");
    } else {
      toast.error("Failed to regenerate lineup");
    }

    setShowEditLineup(false);
    setIsRegenerating(false);
  };

  return (
    <nav className="w-full bg-white border-b border-neutral-100 sticky top-0 z-50 isolate pt-[env(safe-area-inset-top)]">
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
                    onSelect={() => setShowEndConfirmation(true)}
                    className="py-2 active:bg-neutral-200"
                    disabled={isTournamentCompleted}
                  >
                    <CheckCircleIcon size={24} className={isTournamentCompleted ? "text-clx-icon-disabled" : "text-clx-icon-default"} />
                    End tournament
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setShowShareDrawer(true)}
                    className="py-2 active:bg-neutral-200"
                  >
                    <ShareNetworkIcon size={24} className="text-clx-icon-default" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
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
          // Scroll to top when tab changes - use smooth for better iOS support
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        className="px-4 pt-4 pb-3 touch-action-manipulation"
        style={{ touchAction: "manipulation" }}
      >
        <TabsList className="w-full bg-white p-0 h-auto gap-2 tracking-tight relative">
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
          <DrawerContent className="max-h-[90vh] rounded-none!" showHandle={false}>
            <DrawerHeader className="bg-neutral-50 border-b border-clx-border-default px-4 pb-1 pt-2 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DrawerTitle className="text-base font-semibold text-clx-text-default">
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
                <div className="flex-1 p-4 min-h-[50vh] max-h-[70vh]">
                  <div className="pb-5 text-sm">
                    <p>You are able to set the first match player. Please select which player you want to select. This setup will apply for the first round.</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div><span className="text-sm font-semibold">Set players</span></div>
                    <div className="flex items-center gap-4">
                      {/* Team A / Home */}
                      <div className="w-full space-y-3">
                        {isMixAmericano ? (
                          <>
                            {/* Men select */}
                            <Select value={playerA1} onValueChange={setPlayerA1}>
                              <SelectTrigger className="w-full h-11" aria-label="Select Home Man">
                                <div className="flex items-center gap-2">
                                  <GenderMaleIcon size={24} className="text-[#0061EF] shrink-0" />
                                  <SelectValue placeholder="Player A1" />
                                </div>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>Men</SelectLabel>
                                  {getAvailableMen(playerA1).map(player => (
                                    <SelectItem key={player} value={player}>{player}</SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            {/* Women select */}
                            <Select value={playerA2} onValueChange={setPlayerA2}>
                              <SelectTrigger className="w-full h-11" aria-label="Select Home Woman">
                                <div className="flex items-center gap-2">
                                  <GenderFemaleIcon size={24} className="text-[#E01919] shrink-0" />
                                  <SelectValue placeholder="Player A2" />
                                </div>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>Women</SelectLabel>
                                  {getAvailableWomen(playerA2).map(player => (
                                    <SelectItem key={player} value={player}>{player}</SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </>
                        ) : (
                          <>
                            <Select value={playerA1} onValueChange={setPlayerA1}>
                              <SelectTrigger className="w-full h-11" aria-label="Select Player A1">
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
                              <SelectTrigger className="w-full h-11" aria-label="Select Player A2">
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
                          </>
                        )}
                      </div>

                      <span className="text-clx-text-placeholder text-base">v.s</span>

                      {/* Team B / Away */}
                      <div className="w-full space-y-3">
                        {isMixAmericano ? (
                          <>
                            {/* Men select */}
                            <Select value={playerB1} onValueChange={setPlayerB1}>
                              <SelectTrigger className="w-full h-11" aria-label="Select Away Man">
                                <div className="flex items-center gap-2">
                                  <GenderMaleIcon size={24} className="text-[#0061EF] shrink-0" />
                                  <SelectValue placeholder="Player B1" />
                                </div>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>Men</SelectLabel>
                                  {getAvailableMen(playerB1).map(player => (
                                    <SelectItem key={player} value={player}>{player}</SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            {/* Women select */}
                            <Select value={playerB2} onValueChange={setPlayerB2}>
                              <SelectTrigger className="w-full h-11" aria-label="Select Away Woman">
                                <div className="flex items-center gap-2">
                                  <GenderFemaleIcon size={24} className="text-[#E01919] shrink-0" />
                                  <SelectValue placeholder="Player B2" />
                                </div>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>Women</SelectLabel>
                                  {getAvailableWomen(playerB2).map(player => (
                                    <SelectItem key={player} value={player}>{player}</SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </>
                        ) : (
                          <>
                            <Select value={playerB1} onValueChange={setPlayerB1}>
                              <SelectTrigger className="w-full h-11" aria-label="Select Player B1">
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
                              <SelectTrigger className="w-full h-11" aria-label="Select Player B2">
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
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <DrawerFooter>
                  <Button onClick={handleProceed} disabled={!isLineupComplete} className="bg-clx-bg-accent h-11 disabled:bg-clx-bg-disabled disabled:text-clx-text-disabled">
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
        <DialogContent className="px-0 py-3">
          <DialogHeader className="px-4 pb-2 bg-neutral-50 text-left sm:text-left border-b">
            <DialogTitle className="font-semibold text-base">
              Adjust lineup
            </DialogTitle>
          </DialogHeader>
          <div className="px-4 flex flex-col gap-2">
              <Alert className="bg-amber-50 border-amber-200">
                <WarningIcon size={24} weight="fill" className="text-amber-400!" />
                <AlertTitle className="text-amber-600 text-sm font-semibold">The rounds has been scored</AlertTitle>
                <AlertDescription className="text-clx-text-default text-sm">
                Adjusting the lineup will reset all scores.
                </AlertDescription>
              </Alert>
              <div className="text-sm">
                <span>Are you sure want to adjust lineup? This action cannot be undone.</span>
              </div>
          </div>
          <DialogFooter className="flex flex-row items-center justify-end px-4 mt-1 gap-2 sm:gap-2 border-t pt-3">
            <Button variant="ghost" onClick={() => setShowResetConfirmation(false)} className="text-clx-text-secondary">
              Cancel
            </Button>
            <Button onClick={handleConfirmReset} size={"lg"} className="bg-clx-bg-accent font-semibold">
              Continue
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

      {/* Share Tournament Drawer */}
      <ShareTournamentDrawer
        isOpen={showShareDrawer}
        onClose={() => setShowShareDrawer(false)}
        tournament={tournament}
        onTournamentUpdate={onTournamentUpdate}
      />
    </nav>
  );
}
