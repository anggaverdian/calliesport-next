"use client";

import { DotsThreeIcon } from "@phosphor-icons/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tournament, calculateRounds, getPointTypeLabel } from "@/utils/tournament";

interface HistoryTournamentItemProps {
  tournament: Tournament;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatCompletedDate(dateString?: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function HistoryTournamentItem({
  tournament,
  onView,
  onDelete,
}: HistoryTournamentItemProps) {
  const rounds = calculateRounds(tournament.players.length);

  return (
    <div
      className="bg-clx-bg-neutral-subtle border border-clx-border-subtle flex gap-6 items-center px-5 py-3 rounded-xl w-full cursor-pointer hover:bg-clx-bg-neutral-hover transition-colors active:bg-clx-bg-neutral-hover"
      onClick={() => onView(tournament.id)}
    >
      {/* Tournament info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-clx-text-default truncate tracking-tight mb-0.5">
          {tournament.name}
        </p>
        <div className="flex gap-1.5 text-xs text-clx-text-secondary mb-2">
          <span>{rounds} rounds</span>
          <span className="text-stone-300">|</span>
          <span>{tournament.players.length} players</span>
          <span className="text-stone-300">|</span>
          <span>{getPointTypeLabel(tournament.pointType)}</span>
        </div>
        <p className="text-xs text-clx-text-success">
          Completed on {formatCompletedDate(tournament.completedAt)}
        </p>
      </div>

      {/* Action popover */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="shrink-0 p-2 rounded-lg hover:bg-clx-bg-neutral-bold active:bg-clx-bg-neutral-hover transition-colors data-[state=open]:bg-clx-bg-neutral-hover"
            onClick={(e) => e.stopPropagation()}
          >
            <DotsThreeIcon size={24} weight="bold" className="text-clx-icon-dark" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[147px] p-2 border border-clx-border-default rounded-md shadow-lg"
          align="end"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="w-full text-left px-3 py-2 text-sm text-clx-text-default hover:bg-clx-bg-neutral-bold rounded transition-colors"
            onClick={() => onView(tournament.id)}
          >
            View
          </button>
          <button
            type="button"
            className="w-full text-left px-3 py-2 text-sm text-clx-text-danger hover:bg-clx-bg-neutral-bold rounded transition-colors"
            onClick={() => onDelete(tournament.id)}
          >
            Delete
          </button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
