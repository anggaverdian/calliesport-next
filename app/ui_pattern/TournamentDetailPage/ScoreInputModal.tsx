"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Match } from "@/utils/tournament";
import { Button } from "@/components/ui/button";

interface ScoreInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  maxScore: number;
  team: "A" | "B";
  onSave: (scoreA: number, scoreB: number) => void;
  onReset?: () => void;
}

export default function ScoreInputModal({
  isOpen,
  onClose,
  match,
  maxScore,
  team,
  onSave,
  onReset,
}: ScoreInputModalProps) {
  // Generate score options (0 to maxScore)
  const scoreOptions = Array.from({ length: maxScore + 1 }, (_, i) => i);

  // Get current score for the selected team
  const currentScore = team === "A" ? match.scoreA : match.scoreB;

  // Get team players for display
  const teamPlayers = team === "A" ? match.teamA : match.teamB;

  const handleScoreSelect = (score: number) => {
    // Calculate the other team's score (maxScore - selected score)
    const otherScore = maxScore - score;

    if (team === "A") {
      onSave(score, otherScore);
    } else {
      onSave(otherScore, score);
    }
    onClose();
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
      onClose();
    }
  };

  // Check if the match has been completed (scores have been entered)
  const hasScore = match.isCompleted;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[320px] rounded-md p-0 gap-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-base font-semibold">
            Score {teamPlayers.join(" & ")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Select a score for {teamPlayers.join(" and ")}
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 space-y-6">
          {/* Score grid */}
          <div className="grid grid-cols-6 gap-2">
            {scoreOptions.map((score) => {
              const isSelected = score === currentScore;
              return (
                <button
                  key={score}
                  type="button"
                  onClick={() => handleScoreSelect(score)}
                  className={`h-10 rounded-md text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-clx-bg-accent text-white"
                      : "bg-clx-bg-neutral-bold text-clx-text-default hover:bg-clx-bg-neutral-hover"
                  }`}
                >
                  {score}
                </button>
              );
            })}
          </div>

          {/* Reset button - only show if match has a score */}
          {hasScore && onReset && (
            <div className="w-full text-center">
            <Button variant={"outline"} onClick={handleReset}>
                Reset Score
            </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
