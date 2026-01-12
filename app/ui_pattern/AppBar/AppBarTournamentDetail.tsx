"use client";

import Image from "next/image";
import Link from "next/link";
import { DotsThreeOutlineVerticalIcon, TennisBallIcon } from "@phosphor-icons/react";
import back_button from "../../../public/arrow_Left.svg";
import { Tournament, teamTypeNames, TeamType } from "@/utils/tournament";

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

interface AppBarTournamentDetailProps {
  tournament: Tournament;
  activeTab: "round" | "ranking" | "details";
  onTabChange: (tab: "round" | "ranking" | "details") => void;
}

export default function AppBarTournamentDetail({
  tournament,
  activeTab,
  onTabChange,
}: AppBarTournamentDetailProps) {
  const icon = teamTypeIcons[tournament.teamType];
  const pointLabel = tournament.pointType === "21" ? "21 points" :
                     tournament.pointType === "16" ? "16 points" :
                     tournament.pointType === "best4" ? "Best of 4" : "Best of 5";

  return (
    <nav className="w-full bg-white border-b border-clx-border-default">
      {/* Back button */}
      <div className="flex flex-col gap-4 px-4 pt-4 pb-2">
        <Link href="/" className="w-fit">
          <Image src={back_button} width={24} height={24} alt="Back" />
        </Link>

        {/* Tournament info */}
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <Image
              src={icon}
              width={14}
              height={12}
              alt={teamTypeNames[tournament.teamType]}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-clx-text-default truncate">
              {tournament.name}
            </h2>
            <p className="text-xs text-clx-text-secondary">
              {tournament.players.length} players, {pointLabel}
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 p-2 border border-clx-border-textfield rounded-lg"
          >
            <DotsThreeOutlineVerticalIcon size={20} weight="fill" className="text-clx-icon-dark" />
          </button>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2 px-4 pt-4 pb-3">
        <button
          type="button"
          onClick={() => onTabChange("round")}
          className={`flex-1 flex items-center justify-center gap-1.5 h-8 px-4 rounded-lg text-sm transition-colors ${
            activeTab === "round"
              ? "bg-clx-bg-accent text-white font-medium"
              : "bg-clx-bg-neutral-bold text-clx-text-default"
          }`}
        >
          Rounds
        </button>
        <button
          type="button"
          onClick={() => onTabChange("ranking")}
          className={`flex-1 flex items-center justify-center gap-1.5 h-8 px-4 rounded-lg text-sm transition-colors ${
            activeTab === "ranking"
              ? "bg-clx-bg-accent text-white font-medium"
              : "bg-clx-bg-neutral-bold text-clx-text-default"
          }`}
        >
          Leaderboard
        </button>
        <button
          type="button"
          onClick={() => onTabChange("details")}
          className={`flex-1 flex items-center justify-center gap-1.5 h-8 px-4 rounded-lg text-sm transition-colors ${
            activeTab === "details"
              ? "bg-clx-bg-accent text-white font-medium"
              : "bg-clx-bg-neutral-bold text-clx-text-default"
          }`}
        >
          Details
        </button>
      </div>
    </nav>
  );
}
