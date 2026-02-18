"use client";

import Image from "next/image";
import { DotsThreeIcon } from "@phosphor-icons/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tournament, teamTypeNames, calculateRounds, TeamType, getPointTypeLabel } from "@/utils/tournament";

// SVG imports for team type icons
import thunderIcon from "../../../public/thunder.svg";
import chartIcon from "../../../public/charts.svg";
import upIcon from "../../../public/Up.svg";
import starIcon from "../../../public/Star.svg";

// Team type icon mapping
const teamTypeIcons: Record<TeamType, string> = {
  standard: chartIcon,
  mix: thunderIcon,
  team: upIcon,
  mexicano: starIcon,
};

interface TournamentItemProps {
  tournament: Tournament;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function TournamentItem({ tournament, onView, onDelete }: TournamentItemProps) {
  const rounds = calculateRounds(tournament.players.length);
  const icon = teamTypeIcons[tournament.teamType];
  const pointType = tournament.pointType;

  const isTeamType = tournament.teamType === "team";
  const playerOrTeamCount = tournament.players.length;
  const playerOrTeamLabel = isTeamType ? "teams" : "players";

  return (
    <div
      className="bg-clx-bg-neutral-subtle border border-clx-border-default flex flex-col gap-2.5 px-4 py-3 rounded-xl w-full cursor-pointer hover:bg-clx-bg-neutral-hover transition-colors active:bg-clx-bg-neutral-hover"
      onClick={() => onView(tournament.id)}
    >
      {/* Content row */}
      <div className="flex gap-4 items-center pb-1.5 border-b border-clx-border-default">
        {/* Team type icon */}
        <div className="shrink-0 w-[28px] h-[24px]">
          <Image
            src={icon}
            width={28}
            height={24}
            alt={teamTypeNames[tournament.teamType]}
          />
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-clx-text-secondary leading-[18px]">
            {teamTypeNames[tournament.teamType]}
          </p>
          <p className="text-lg font-bold text-clx-text-default leading-6 truncate tracking-wide">
            {tournament.name}
          </p>
        </div>

        {/* Action popover */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="shrink-0 flex items-center justify-center size-8 rounded-lg hover:bg-clx-bg-neutral-bold active:bg-clx-bg-neutral-hover transition-colors data-[state=open]:bg-clx-bg-neutral-hover"
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

      {/* Caption row */}
      <div className="flex gap-2 items-center text-xs text-clx-text-default tracking-wide">
        <span>{playerOrTeamCount} {playerOrTeamLabel}</span>
        <span className="size-1.5 rounded-full bg-clx-cream" />
        <span>{rounds} rounds</span>
        <span className="size-1.5 rounded-full bg-clx-cream" />
        <span>{getPointTypeLabel(tournament.pointType)}</span>
      </div>
    </div>
  );
}
