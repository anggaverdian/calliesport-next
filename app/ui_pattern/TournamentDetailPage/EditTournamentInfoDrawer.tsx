"use client";

import { useState, useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerHeader, DrawerClose,
} from "@/components/ui/drawer";
import { XIcon } from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Tournament,
  updateTournamentInfo,
  hasAnyScoredRound,
  getPointTypeLabel,
} from "@/utils/tournament";
import { toast } from "sonner";

interface EditTournamentInfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament;
  onUpdate: (updatedTournament: Tournament) => void;
}

const POINT_TYPE_OPTIONS = [
  { value: "21", label: "21 points" },
  { value: "16", label: "16 points" },
  { value: "best4", label: "Best of 4" },
  { value: "best5", label: "Best of 5" },
];

export default function EditTournamentInfoDrawer({
  isOpen,
  onClose,
  tournament,
  onUpdate,
}: EditTournamentInfoDrawerProps) {
  const [name, setName] = useState(tournament.name);
  const [pointType, setPointType] = useState(tournament.pointType);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Reset form when drawer opens
  useEffect(() => {
    if (isOpen) {
      setName(tournament.name);
      setPointType(tournament.pointType);
    }
  }, [isOpen, tournament]);

  const handleSave = () => {
    // Check if point type changed and there are scored rounds
    if (pointType !== tournament.pointType && hasAnyScoredRound(tournament)) {
      setShowResetConfirm(true);
      return;
    }

    // Proceed with save
    saveChanges(false);
  };

  const saveChanges = (resetScores: boolean) => {
    const updated = updateTournamentInfo(
      tournament.id,
      name,
      pointType,
      resetScores
    );

    if (updated) {
      onUpdate(updated);
      toast.success("Tournament info updated");
      onClose();
    }
  };

  const handleConfirmReset = () => {
    setShowResetConfirm(false);
    saveChanges(true);
  };

  const handleCancelReset = () => {
    setShowResetConfirm(false);
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <>
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="pb-2">
        <DrawerHeader className="border-b border-neutral-100 px-4 pb-3 pt-0 shrink-0 h-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DrawerClose asChild>
                  <button type="button" className="text-clx-icon-default">
                    <XIcon size={22} />
                  </button>
                </DrawerClose>
                <DrawerTitle className="sr-only">Edit Tournament Info</DrawerTitle>
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
          <div className="flex flex-col gap-5 py-4 px-4 h-screen">
            {/* Tournament name input */}
            <div className="flex flex-col gap-1">
              <Label className="text-base font-semibold text-clx-text-default">
                Tournament name
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter tournament name"
                className="h-11 text-base border-clx-border-textfield rounded-lg"
              />
            </div>

            {/* Point match selection */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col">
                <Label className="text-base font-semibold text-clx-text-default">
                  Point match
                </Label>
                <span className="text-xs text-clx-text-dark-subtle">
                  Which point match do you want to play?
                </span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2">
                {POINT_TYPE_OPTIONS.map((option) => {
                  const isSelected = pointType === option.value;
                  return (
                    <Badge
                      key={option.value}
                      variant="outline"
                      onClick={() => setPointType(option.value)}
                      className={`shrink-0 whitespace-nowrap px-3 py-1.5 h-auto text-sm cursor-pointer ${
                        isSelected
                          ? "bg-clx-bg-neutral-bold text-clx-text-default font-semibold border-neutral-200"
                          : "bg-white text-clx-text-default font-normal border-clx-border-textfield hover:bg-clx-bg-neutral-hover"
                      }`}
                    >
                      {option.label}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Confirmation dialog for score reset */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent showCloseButton={false} className="max-w-[320px]">
          <DialogHeader>
            <DialogTitle>Reset all scores?</DialogTitle>
            <DialogDescription>
              Changing the point match from{" "}
              <span className="font-medium text-clx-text-default">
                {getPointTypeLabel(tournament.pointType)}
              </span>{" "}
              to{" "}
              <span className="font-medium text-clx-text-default">
                {getPointTypeLabel(pointType)}
              </span>{" "}
              will reset all round scores. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={handleConfirmReset}
              className="w-full bg-clx-bg-accent hover:bg-clx-bg-accent/90"
            >
              Reset and save
            </Button>
            <Button
              variant="ghost"
              onClick={handleCancelReset}
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
