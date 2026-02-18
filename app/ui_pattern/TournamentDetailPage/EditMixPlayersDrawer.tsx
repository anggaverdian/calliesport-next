"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerHeader,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DotsThreeIcon,
  XIcon,
  GenderMale as GenderMaleIcon,
  GenderFemale as GenderFemaleIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import usersIllustration from "../../../public/Create/Add Player/Users.svg";
import {
  MixTournament,
  MixPlayer,
  Gender,
  renameMixPlayer,
  updateMixAmericanoPlayers,
  updateMixPlayerGenders,
  MIX_AMERICANO_ALLOWED_PLAYERS,
  MIX_AMERICANO_6_MEN,
  MIX_AMERICANO_6_WOMEN,
  MIX_AMERICANO_8_MEN,
  MIX_AMERICANO_8_WOMEN,
} from "@/utils/MixAmericanoTournament";
import { toast } from "sonner";

interface EditMixPlayersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: MixTournament;
  onUpdate: (updatedTournament: MixTournament) => void;
}

export default function EditMixPlayersDrawer({
  isOpen,
  onClose,
  tournament,
  onUpdate,
}: EditMixPlayersDrawerProps) {
  // Convert tournament players to MixPlayer format
  const getInitialPlayers = (): MixPlayer[] => {
    return tournament.players.map((name) => ({
      name,
      gender: tournament.playerGenders[name] || "male",
    }));
  };

  const [mixPlayers, setMixPlayers] = useState<MixPlayer[]>(getInitialPlayers());
  const [playerInput, setPlayerInput] = useState("");
  const [playerInputError, setPlayerInputError] = useState("");
  const [openPopoverIndex, setOpenPopoverIndex] = useState<number | null>(null);

  // Edit player dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPlayerIndex, setEditingPlayerIndex] = useState<number | null>(null);
  const [editingPlayerName, setEditingPlayerName] = useState("");

  // Confirmation modal for save
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // Track if add/remove actions were used (vs just renaming or gender change)
  const [hasStructuralChange, setHasStructuralChange] = useState(false);

  const isDrawerClosingRef = useRef(false);
  const playerInputRef = useRef<HTMLInputElement>(null);

  // Blur input when user touches anything outside the input (dismisses keyboard)
  const handleDrawerContentTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (playerInputRef.current && !playerInputRef.current.contains(target)) {
      playerInputRef.current.blur();
    }
  }, []);

  // Reset form when drawer opens
  useEffect(() => {
    if (isOpen) {
      setMixPlayers(getInitialPlayers());
      setPlayerInput("");
      setPlayerInputError("");
      setOpenPopoverIndex(null);
      setHasStructuralChange(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tournament]);

  // Calculate men and women counts
  const menCount = mixPlayers.filter((p) => p.gender === "male").length;
  const womenCount = mixPlayers.filter((p) => p.gender === "female").length;

  // Get player changes for the confirmation modal
  const getPlayerChanges = () => {
    const originalPlayers = tournament.players;

    // If add/remove/gender actions were used, it's a structural change
    if (hasStructuralChange) {
      const originalLower = originalPlayers.map((p) => p.toLowerCase());
      const currentLower = mixPlayers.map((p) => p.name.toLowerCase());
      const added = mixPlayers.filter(
        (p) => !originalLower.includes(p.name.toLowerCase())
      );
      const removed = originalPlayers.filter(
        (p) => !currentLower.includes(p.toLowerCase())
      );
      return { added, removed, renames: [], hasPlayerCountChanged: true };
    }

    // No structural changes (only edit name used) - check for renames
    const renames: { oldName: string; newName: string }[] = [];

    // Check by index for name changes
    for (let i = 0; i < originalPlayers.length; i++) {
      if (originalPlayers[i] !== mixPlayers[i]?.name) {
        renames.push({ oldName: originalPlayers[i], newName: mixPlayers[i].name });
      }
    }

    return { added: [], removed: [], renames, hasPlayerCountChanged: false };
  };

  const handleAddPlayer = () => {
    const name = playerInput.trim();
    if (!name) return;

    const maxAllowed = Math.max(...MIX_AMERICANO_ALLOWED_PLAYERS);
    if (mixPlayers.length >= maxAllowed) {
      setPlayerInputError(`Mix Americano allows only 6 or 8 players (currently ${mixPlayers.length}).`);
      return;
    }

    const isDuplicate = mixPlayers.some(p => p.name.toLowerCase() === name.toLowerCase());
    if (isDuplicate) {
      setPlayerInputError(`Player "${name}" already exists.`);
      return;
    }

    setPlayerInputError("");
    setMixPlayers([...mixPlayers, { name, gender: "male" as Gender }]);
    setPlayerInput("");
    setHasStructuralChange(true);
  };

  const handleRemovePlayer = (index: number) => {
    setOpenPopoverIndex(null);

    // Remove from local state
    setMixPlayers(mixPlayers.filter((_, i) => i !== index));
    setHasStructuralChange(true);
  };

  const handleToggleGender = (index: number) => {
    const updatedMixPlayers = [...mixPlayers];
    updatedMixPlayers[index] = {
      ...updatedMixPlayers[index],
      gender: updatedMixPlayers[index].gender === "male" ? "female" : "male",
    };
    setMixPlayers(updatedMixPlayers);
    // Gender change does NOT set structural change - rounds won't be regenerated
  };

  // Check if only genders changed (no add/remove/rename)
  const getGenderChanges = (): { playerName: string; newGender: Gender }[] => {
    const changes: { playerName: string; newGender: Gender }[] = [];
    const originalPlayers = tournament.players;

    for (let i = 0; i < originalPlayers.length; i++) {
      const playerName = originalPlayers[i];
      const currentPlayer = mixPlayers.find((p) => p.name === playerName);
      if (currentPlayer && tournament.playerGenders[playerName] !== currentPlayer.gender) {
        changes.push({ playerName, newGender: currentPlayer.gender });
      }
    }

    return changes;
  };

  const handleSave = () => {
    // Validate player count and gender ratio
    const playerCount = mixPlayers.length;

    // Check if player count is valid (6 or 8)
    if (!MIX_AMERICANO_ALLOWED_PLAYERS.includes(playerCount)) {
      toast.error(
        `Mix Americano requires exactly 6 or 8 players (currently ${playerCount})`
      );
      return;
    }

    // Determine required counts based on player count
    const requiredMen = playerCount === 6 ? MIX_AMERICANO_6_MEN : MIX_AMERICANO_8_MEN;
    const requiredWomen =
      playerCount === 6 ? MIX_AMERICANO_6_WOMEN : MIX_AMERICANO_8_WOMEN;

    // Check for correct men/women ratio
    if (menCount !== requiredMen || womenCount !== requiredWomen) {
      toast.error(
        `${playerCount} players requires ${requiredMen} men and ${requiredWomen} women (currently ${menCount} men, ${womenCount} women)`
      );
      return;
    }

    const { renames, hasPlayerCountChanged } = getPlayerChanges();
    const genderChanges = getGenderChanges();

    // Case 1: Only renames - apply directly without modal
    if (renames.length > 0 && !hasPlayerCountChanged && genderChanges.length === 0) {
      let result: MixTournament | null = tournament;

      for (const { oldName, newName } of renames) {
        if (result) {
          result = renameMixPlayer(result.id, oldName, newName);
        }
      }

      if (result) {
        onUpdate(result);
        toast.success(
          renames.length === 1
            ? "Player name updated"
            : `${renames.length} player names updated`
        );
      }

      onClose();
      return;
    }

    // Case 2: Only gender changes (no add/remove) - apply directly without modal
    if (genderChanges.length > 0 && !hasPlayerCountChanged && renames.length === 0) {
      const newPlayerGenders: Record<string, Gender> = {};
      mixPlayers.forEach((p) => {
        newPlayerGenders[p.name] = p.gender;
      });

      const result = updateMixPlayerGenders(tournament.id, newPlayerGenders);
      if (result) {
        onUpdate(result);
        toast.success(
          genderChanges.length === 1
            ? "Player gender updated"
            : `${genderChanges.length} player genders updated`
        );
      }

      onClose();
      return;
    }

    // Case 3: Renames + gender changes (no add/remove) - apply both directly
    if ((renames.length > 0 || genderChanges.length > 0) && !hasPlayerCountChanged) {
      let result: MixTournament | null = tournament;

      // Apply renames first
      for (const { oldName, newName } of renames) {
        if (result) {
          result = renameMixPlayer(result.id, oldName, newName);
        }
      }

      // Then apply gender changes
      if (result) {
        const newPlayerGenders: Record<string, Gender> = {};
        mixPlayers.forEach((p) => {
          newPlayerGenders[p.name] = p.gender;
        });
        result = updateMixPlayerGenders(result.id, newPlayerGenders);
      }

      if (result) {
        onUpdate(result);
        const messages: string[] = [];
        if (renames.length > 0) messages.push(`${renames.length} name(s)`);
        if (genderChanges.length > 0) messages.push(`${genderChanges.length} gender(s)`);
        toast.success(`Updated ${messages.join(" and ")}`);
      }

      onClose();
      return;
    }

    // Case 4: Players added/removed - show confirmation modal
    if (hasPlayerCountChanged) {
      setShowSaveConfirm(true);
      return;
    }

    // No changes
    onClose();
  };

  const handleConfirmSave = () => {
    // Update tournament with new players
    const result = updateMixAmericanoPlayers(tournament.id, mixPlayers);

    if (result) {
      onUpdate(result);
      toast.success("Players updated. Rounds have been regenerated.");
    } else {
      toast.error("Failed to update players");
    }

    setShowSaveConfirm(false);
    onClose();
  };

  const handleEditPlayer = (index: number) => {
    setOpenPopoverIndex(null);
    setEditingPlayerIndex(index);
    setEditingPlayerName(mixPlayers[index].name);
    setEditDialogOpen(true);
  };

  const handleSaveEditPlayer = () => {
    if (editingPlayerIndex === null) return;

    const trimmedName = editingPlayerName.trim();
    if (!trimmedName) {
      toast.error("Player name cannot be empty");
      return;
    }

    // Check if the new name already exists (excluding the current player)
    const otherPlayers = mixPlayers.filter((_, i) => i !== editingPlayerIndex);
    const isDuplicate = otherPlayers.some(
      (p) => p.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      toast.error(
        `Player "${trimmedName}" already exists. Each player must have a unique name.`
      );
      return;
    }

    // Update local state only (will be saved when clicking main Save button)
    const updatedPlayers = [...mixPlayers];
    updatedPlayers[editingPlayerIndex] = {
      ...updatedPlayers[editingPlayerIndex],
      name: trimmedName,
    };
    setMixPlayers(updatedPlayers);

    setEditDialogOpen(false);
    setEditingPlayerIndex(null);
    setEditingPlayerName("");
  };

  return (
    <>
      <Drawer open={isOpen} onOpenChange={(open) => {
          if (!open) {
            isDrawerClosingRef.current = true;
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.blur();
            }
            requestAnimationFrame(() => {
              isDrawerClosingRef.current = false;
            });
          }
          onClose();
        }}>
        <DrawerContent className="pb-2 max-h-[90vh] rounded-none!">
          <DrawerHeader className="border-b border-neutral-100 px-4 pb-3 pt-0 shrink-0 h-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DrawerClose asChild>
                  <button type="button" className="text-clx-icon-default">
                    <XIcon size={22} />
                  </button>
                </DrawerClose>
                <DrawerTitle className="sr-only">Edit Players</DrawerTitle>
              </div>
              <Button
                variant="ghost"
                onClick={handleSave}
                className="text-base font-semibold text-clx-text-accent p-0 h-auto hover:bg-transparent"
              >
                Save
              </Button>
            </div>
          </DrawerHeader>

          <div className="flex flex-col gap-8 py-4 pb-20 overflow-y-auto flex-1 px-4 min-h-[80vh] max-h-[80vh]" onTouchStart={handleDrawerContentTouchStart}>
            {/* Input section */}
            <div className="space-y-1">
              <Label className="text-base font-semibold text-clx-text-default">
                Add player name
              </Label>
              <Input
                ref={playerInputRef}
                type="text"
                enterKeyHint="enter"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="words"
                placeholder="Player name"
                className={`h-11 text-base ${playerInputError ? "border-clx-border-danger" : "border-clx-border-textfield"}`}
                value={playerInput}
                onChange={(e) => {
                  setPlayerInput(e.target.value);
                  if (playerInputError) setPlayerInputError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddPlayer();
                  }
                }}
                onBlur={() => {
                  if (!isDrawerClosingRef.current && playerInput.trim()) {
                    handleAddPlayer();
                  }
                }}
              />
              {playerInputError ? (
                <p className="text-sm text-clx-text-danger">{playerInputError}</p>
              ) : (
                <p className="text-xs text-clx-text-secondary tracking-[0.2px]">
                  Type name and enter on your keyboard to add.
                </p>
              )}
            </div>

            {/* Players list section */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between h-8">
                <p className="text-base font-semibold text-clx-text-default">Players</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-clx-text-default">{mixPlayers.length}</p>
                  <UsersIcon size={20} className="text-clx-text-default" />
                </div>
              </div>

              {/* Gender counts */}
              {mixPlayers.length > 0 && (
                <div className="flex gap-4 text-sm">
                  <p>
                    <span className="text-clx-text-accent">Men</span>
                    <span className="text-clx-text-secondary">: </span>
                    <span className="text-clx-text-default">{menCount}</span>
                  </p>
                  <p>
                    <span className="text-red-500">Women</span>
                    <span className="text-clx-text-secondary">: </span>
                    <span className="text-clx-text-default">{womenCount}</span>
                  </p>
                </div>
              )}

              {mixPlayers.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-6 rounded-lg">
                  <Image src={usersIllustration} width={80} height={80} alt="No players" />
                  <div className="text-center">
                    <p className="text-base font-semibold text-clx-text-default">No players added yet</p>
                    <p className="text-sm text-clx-text-secondary">Add player by input their name on textfield.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {mixPlayers.map((player, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 h-12 px-4 py-2 bg-clx-bg-neutral-subtle rounded-md border-0"
                    >
                      <span className="text-sm text-clx-text-placeholder">
                        {index + 1}.
                      </span>
                      <span className="flex-1 text-sm font-semibold text-clx-text-default truncate">
                        {player.name}
                      </span>
                      {/* Gender toggle button */}
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8 rounded-lg border-clx-border-default bg-white"
                        onClick={() => handleToggleGender(index)}
                      >
                        {player.gender === "male" ? (
                          <GenderMaleIcon
                            size={20}
                            weight="regular"
                            className="text-clx-text-accent"
                          />
                        ) : (
                          <GenderFemaleIcon
                            size={20}
                            weight="regular"
                            className="text-red-500"
                          />
                        )}
                      </Button>
                      <Popover
                        open={openPopoverIndex === index}
                        onOpenChange={(open) =>
                          setOpenPopoverIndex(open ? index : null)
                        }
                      >
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={`size-8 rounded-lg ${
                              openPopoverIndex === index
                                ? "bg-neutral-200"
                                : "bg-transparent hover:bg-clx-bg-neutral-hover"
                            }`}
                          >
                            <DotsThreeIcon
                              size={24}
                              weight="bold"
                              className="text-clx-text-default w-auto! h-auto!"
                            />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="end"
                          className="w-[104px] p-0 py-2 rounded-md shadow-lg border border-[#e1e0e0]"
                        >
                          <button
                            type="button"
                            onClick={() => handleEditPlayer(index)}
                            className="w-full px-3 py-2 text-left text-sm text-clx-text-default hover:bg-clx-bg-neutral-subtle"
                          >
                            Edit name
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemovePlayer(index)}
                            className="w-full px-3 py-2 text-left text-sm text-clx-text-danger hover:bg-clx-bg-neutral-subtle"
                          >
                            Remove
                          </button>
                        </PopoverContent>
                      </Popover>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Edit Player Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent showCloseButton={false} className="w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle>Edit player name</DialogTitle>
          </DialogHeader>
          <Input
            value={editingPlayerName}
            onChange={(e) => setEditingPlayerName(e.target.value)}
            placeholder="Enter player name"
            className="h-11 text-base"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSaveEditPlayer();
              }
            }}
          />
          <DialogFooter className="flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-11"
              onClick={() => setEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1 h-11 bg-clx-bg-accent text-white"
              onClick={handleSaveEditPlayer}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Confirmation Modal */}
      <Dialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <DialogContent showCloseButton={false} className="max-w-[320px]">
          <DialogHeader>
            <DialogTitle>Save changes?</DialogTitle>
            <DialogDescription>
              Saving player changes will reset and regenerate all rounds. All
              existing rounds will be replaced and this action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={handleConfirmSave}
              className="w-full bg-clx-bg-accent hover:bg-clx-bg-accent/90"
            >
              Save and regenerate
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowSaveConfirm(false)}
              className="w-full text-clx-text-secondary"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
