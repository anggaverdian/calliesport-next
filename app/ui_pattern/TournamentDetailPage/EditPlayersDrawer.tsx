"use client";

import { useState, useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerHeader, DrawerClose,
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
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon, DotsThreeIcon, XIcon } from "@phosphor-icons/react";
import {
  Tournament,
  renamePlayer,
  addPlayersToTournament,
  removePlayerFromTournament,
  MIN_PLAYERS,
  MAX_PLAYERS,
} from "@/utils/tournament";
import { toast } from "sonner";

interface EditPlayersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament;
  onUpdate: (updatedTournament: Tournament) => void;
}

export default function EditPlayersDrawer({
  isOpen,
  onClose,
  tournament,
  onUpdate,
}: EditPlayersDrawerProps) {
  const [players, setPlayers] = useState<string[]>(tournament.players);
  const [playerInput, setPlayerInput] = useState("");
  const [playerInputError, setPlayerInputError] = useState("");
  const [openPopoverIndex, setOpenPopoverIndex] = useState<number | null>(null);

  // Edit player dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPlayerIndex, setEditingPlayerIndex] = useState<number | null>(null);
  const [editingPlayerName, setEditingPlayerName] = useState("");

  // Confirmation modal for save
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // Track if add/remove actions were used (vs just renaming)
  const [hasStructuralChange, setHasStructuralChange] = useState(false);

  // Reset form when drawer opens
  useEffect(() => {
    if (isOpen) {
      setPlayers(tournament.players);
      setPlayerInput("");
      setPlayerInputError("");
      setOpenPopoverIndex(null);
      setHasStructuralChange(false);
    }
  }, [isOpen, tournament]);

  // Calculate player changes for the confirmation modal
  const getPlayerChanges = () => {
    const originalPlayers = tournament.players;

    // If add/remove actions were used, it's a structural change that requires regeneration
    if (hasStructuralChange) {
      const originalLower = originalPlayers.map(p => p.toLowerCase());
      const currentLower = players.map(p => p.toLowerCase());
      const added = players.filter(p => !originalLower.includes(p.toLowerCase()));
      const removed = originalPlayers.filter(p => !currentLower.includes(p.toLowerCase()));
      return { added, removed, renames: [], hasPlayerCountChanged: true };
    }

    // No structural changes (only edit name used) - check for renames
    const renames: { oldName: string; newName: string }[] = [];

    // Check by index for name changes (same position, different exact name - e.g., case change or typo fix)
    for (let i = 0; i < originalPlayers.length; i++) {
      if (originalPlayers[i] !== players[i]) {
        renames.push({ oldName: originalPlayers[i], newName: players[i] });
      }
    }

    return { added: [], removed: [], renames, hasPlayerCountChanged: false };
  };

  const handleAddPlayers = () => {
    if (!playerInput.trim()) return;

    // Split by comma or newline, trim whitespace, filter empty strings
    const newPlayerNames = playerInput
      .split(/[,\n]/)
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    if (newPlayerNames.length === 0) return;

    // Check for duplicates within the new input
    const lowerCaseNewPlayers = newPlayerNames.map(name => name.toLowerCase());
    const uniqueNewPlayers = new Set(lowerCaseNewPlayers);
    if (uniqueNewPlayers.size !== newPlayerNames.length) {
      setPlayerInputError("Duplicate names found in input. Each player must have a unique name.");
      return;
    }

    // Check for duplicates with existing players
    const existingLowerCase = players.map(name => name.toLowerCase());
    const duplicates = newPlayerNames.filter(name => existingLowerCase.includes(name.toLowerCase()));
    if (duplicates.length > 0) {
      setPlayerInputError(`Player "${duplicates[0]}" already exists. Each player must have a unique name.`);
      return;
    }

    // Check max player limit
    const totalPlayers = players.length + newPlayerNames.length;
    if (totalPlayers > MAX_PLAYERS) {
      setPlayerInputError(`Maximum ${MAX_PLAYERS} players allowed. You already have ${players.length} players.`);
      return;
    }

    // Clear error and add to local state
    setPlayerInputError("");
    setPlayers([...players, ...newPlayerNames]);
    setPlayerInput("");
    setHasStructuralChange(true);
  };

  const handleRemovePlayer = (index: number) => {
    setOpenPopoverIndex(null);

    // Check min player limit
    if (players.length <= MIN_PLAYERS) {
      toast.error(`Minimum ${MIN_PLAYERS} players required.`);
      return;
    }

    // Remove from local state
    setPlayers(players.filter((_, i) => i !== index));
    setHasStructuralChange(true);
  };

  const handleSave = () => {
    const { renames, hasPlayerCountChanged } = getPlayerChanges();

    // Case 1: Only renames - apply directly without modal
    if (renames.length > 0 && !hasPlayerCountChanged) {
      let result: Tournament | null = tournament;

      for (const { oldName, newName } of renames) {
        if (result) {
          result = renamePlayer(result.id, oldName, newName);
        }
      }

      if (result) {
        onUpdate(result);
        toast.success(renames.length === 1 ? "Player name updated" : `${renames.length} player names updated`);
      }

      onClose();
      return;
    }

    // Case 2: Players added or removed - show confirmation modal
    if (hasPlayerCountChanged) {
      setShowSaveConfirm(true);
      return;
    }

    // No changes
    onClose();
  };

  const handleConfirmSave = () => {
    const { added, removed } = getPlayerChanges();

    let result: Tournament | null = tournament;

    // First remove players
    for (const playerName of removed) {
      if (result) {
        result = removePlayerFromTournament(result.id, playerName);
      }
    }

    // Then add new players
    if (result && added.length > 0) {
      result = addPlayersToTournament(result.id, added);
    }

    if (result) {
      onUpdate(result);
      const messages: string[] = [];
      if (added.length > 0) messages.push(`${added.length} player(s) added`);
      if (removed.length > 0) messages.push(`${removed.length} player(s) removed`);
      toast.success(`${messages.join(", ")}. Rounds have been regenerated.`);
    }

    setShowSaveConfirm(false);
    onClose();
  };

  const handleEditPlayer = (index: number) => {
    setOpenPopoverIndex(null);
    setEditingPlayerIndex(index);
    setEditingPlayerName(players[index]);
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
    const otherPlayers = players.filter((_, i) => i !== editingPlayerIndex);
    const isDuplicate = otherPlayers.some(p => p.toLowerCase() === trimmedName.toLowerCase());
    if (isDuplicate) {
      toast.error(`Player "${trimmedName}" already exists. Each player must have a unique name.`);
      return;
    }

    // Update local state only (will be saved when clicking main Save button)
    const updatedPlayers = [...players];
    updatedPlayers[editingPlayerIndex] = trimmedName;
    setPlayers(updatedPlayers);

    setEditDialogOpen(false);
    setEditingPlayerIndex(null);
    setEditingPlayerName("");
  };

  return (
    <>
      <Drawer open={isOpen} onOpenChange={onClose}>
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

          <div className="flex flex-col gap-8 py-4 pb-20 overflow-y-auto flex-1 px-4 min-h-[80vh] max-h-[80vh]">
            {/* Input section */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <Label className="text-base font-semibold text-clx-text-default">
                  Input player name
                </Label>
                <Textarea
                  placeholder="e.g callie, mayo, eckel, jojo"
                  className={`h-20 text-base resize-none ${playerInputError ? "border-clx-border-danger" : "border-clx-border-textfield"}`}
                  value={playerInput}
                  onChange={(e) => {
                    setPlayerInput(e.target.value);
                    if (playerInputError) setPlayerInputError("");
                  }}
                />
                {playerInputError && (
                  <p className="text-sm text-clx-text-danger">{playerInputError}</p>
                )}
              </div>
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-clx-text-default">
                  Bulk add player names separated by commas or new lines.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 px-4 pl-2! border-clx-border-textfield rounded-lg gap-2 shrink-0 disabled:opacity-50 disabled:bg-clx-bg-disabled"
                  onClick={handleAddPlayers}
                  disabled={!playerInput.trim()}
                >
                  <PlusIcon size={24} className="text-clx-text-default" />
                  <span className="font-bold text-clx-text-default">Add</span>
                </Button>
              </div>
            </div>

            {/* Players list section */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-clx-text-default">Players list</p>
                <p className="text-sm text-clx-text-secondary">
                  Total: <span className="text-clx-text-default">{players.length} players</span>
                </p>
              </div>

              {players.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-sm text-clx-text-placeholder">No players added yet</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {players.map((player, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 h-12 px-4 py-2 bg-clx-bg-neutral-subtle rounded-md border-0"
                    >
                      <span className="text-sm text-clx-text-placeholder">{index + 1}.</span>
                      <span className="flex-1 text-sm font-semibold text-clx-text-default truncate">
                        {player}
                      </span>
                      <Popover
                        open={openPopoverIndex === index}
                        onOpenChange={(open) => setOpenPopoverIndex(open ? index : null)}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={`size-8 rounded-lg ${openPopoverIndex === index ? "bg-neutral-200" : "bg-transparent hover:bg-clx-bg-neutral-hover"}`}
                          >
                            <DotsThreeIcon size={24} weight="bold" className="text-clx-text-default w-auto! h-auto!" />
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
              Saving player changes will reset and regenerate all rounds.
              All existing rounds will be replaced and this action cannot be undone.
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
