"use client";

import { PlusIcon } from "@phosphor-icons/react";

export type BannerType = "warning" | "addRound" | "endGame" | "completeTournament";

interface TournamentBannerProps {
  type: BannerType;
  skippedRoundsCount?: number;
  onViewClick?: () => void;
  onAddRoundClick?: () => void;
  onEndGameClick?: () => void;
}

export default function TournamentBanner({
  type,
  skippedRoundsCount = 0,
  onViewClick,
  onAddRoundClick,
  onEndGameClick,
}: TournamentBannerProps) {
  if (type === "warning") {
    return (
      <div className="flex items-center gap-4 px-4 py-3 bg-clx-bg-warning-subtle w-full">
        <p className="flex-1 text-xs leading-[18px] tracking-[0.2px] text-clx-text-warning">
          You have {skippedRoundsCount} round(s) not completed yet!
          <br />
          Complete all rounds to add more or end game.
        </p>
        <button
          type="button"
          onClick={onViewClick}
          className="flex items-center justify-center h-8 px-3 py-4 bg-white border border-clx-border-textfield rounded-lg"
        >
          <span className="text-sm font-bold leading-6 tracking-[0.2px] text-clx-text-default">
            View
          </span>
        </button>
      </div>
    );
  }

  if (type === "addRound") {
    return (
      <div className="flex items-center gap-4 px-4 py-3 bg-clx-bg-accent-subtle w-full">
        <p className="flex-1 text-sm leading-5 tracking-[0.2px] text-clx-text-accent">
          First round first set is completed!
        </p>
        <button
          type="button"
          onClick={onAddRoundClick}
          className="flex items-center gap-1 h-8 pl-2 pr-3 bg-white border border-clx-border-textfield rounded-lg"
        >
          <PlusIcon size={24} weight="bold" className="text-clx-text-default" />
          <span className="text-sm font-semibold leading-5 tracking-[0.2px] text-clx-text-default">
            Round
          </span>
        </button>
      </div>
    );
  }

  if (type === "endGame") {
    return (
      <div className="flex items-center gap-4 px-4 py-3 bg-clx-bg-accent-subtle w-full">
        <p className="flex-1 text-sm leading-5 tracking-[0.2px] text-clx-text-accent">
          First all round set is completed!
        </p>
        <button
          type="button"
          onClick={onEndGameClick}
          className="flex items-center justify-center gap-2 h-8 px-3 bg-white border border-clx-border-textfield rounded-lg"
        >
          <span className="text-sm font-semibold leading-5 tracking-[0.2px] text-clx-text-default">
            End game
          </span>
        </button>
      </div>
    );
  }

  if (type === "completeTournament") {
    return (
      <div className="flex items-center gap-4 px-4 py-3 bg-clx-bg-success-subtle w-full">
        <p className="flex-1 text-sm leading-5 tracking-[0.2px] text-clx-text-success">
          This tournament is already done.
        </p>
      </div>
    );
  }

  return null;
}
