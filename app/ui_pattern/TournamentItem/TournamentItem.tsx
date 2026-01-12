"use client";

import Image from "next/image";
import { DotsThreeIcon } from "@phosphor-icons/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tournament, teamTypeNames, calculateRounds, TeamType } from "@/utils/tournament";

// SVG imports for team type icons
import thunderIcon from "../../../public/thunder.svg";
import chartIcon from "../../../public/Chart.svg";
import upIcon from "../../../public/Up.svg";
import starIcon from "../../../public/Star.svg";

// Team type icon mapping
const teamTypeIcons: Record<TeamType, string> = {
  standard: thunderIcon,
  mix: chartIcon,
  team: upIcon,
  mexicano: starIcon,
};

interface TournamentItemProps {
  tournament: Tournament;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function TournamentItem({ tournament, onView, onDelete }: TournamentItemProps) {
  const rounds = calculateRounds(tournament.players.length);
  const icon = teamTypeIcons[tournament.teamType];

  return (
    <div
      className="bg-clx-bg-neutral-subtle border border-clx-border-subtle flex gap-6 items-center px-5 py-3 rounded-xl w-full cursor-pointer hover:bg-clx-bg-neutral-hover transition-colors"
      onClick={() => onView(tournament.id)}
    >
      {/* Team type icon */}
      <div className="shrink-0 size-6">
        <Image
          src={icon}
          width={24}
          height={24}
          alt={teamTypeNames[tournament.teamType]}
        />
      </div>

      {/* Tournament info */}
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold text-clx-text-default truncate">
          {tournament.name}
        </p>
        <div className="flex gap-2 text-sm text-clx-text-secondary">
          <span>{rounds} rounds</span>
          <span>{tournament.players.length} players</span>
        </div>
      </div>

      {/* Action popover */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="shrink-0 p-2 rounded-lg hover:bg-clx-bg-neutral-bold transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <DotsThreeIcon size={18} weight="bold" className="text-clx-icon-default" />
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
