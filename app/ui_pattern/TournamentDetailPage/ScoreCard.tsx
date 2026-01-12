"use client";

import { UserIcon } from "@phosphor-icons/react";
import { Match } from "@/utils/tournament";
import { DotsThreeOutlineIcon, CheckCircleIcon } from "@phosphor-icons/react";

interface ScoreCardProps {
  match: Match;
  onScoreClickA: () => void;
  onScoreClickB: () => void;
}

export default function ScoreCard({ match, onScoreClickA, onScoreClickB }: ScoreCardProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Score display */}
      <div className="flex items-center justify-center gap-1.5 space-x-16">
        <span className="text-sm text-clx-text-secondary">Court 1</span>
        <div className="flex items-center space-x-1">
        <button
          type="button"
          onClick={onScoreClickA}
          className="bg-clx-bg-dark flex flex-col items-center justify-center w-[52px] h-12 rounded-md"
        >
          <span className="font-mono text-[28px] text-white leading-7">
            {match.scoreA.toString().padStart(2, "0")}
          </span>
        </button>
        <span className="text-base font-semibold text-clx-text-placeholder">:</span>
        <button
          type="button"
          onClick={onScoreClickB}
          className="bg-clx-bg-dark flex flex-col items-center justify-center w-[52px] h-12 rounded-md"
        >
          <span className="font-mono text-[28px] text-white leading-7">
            {match.scoreB.toString().padStart(2, "0")}
          </span>
        </button>
        </div>
        <button type="button" className="p-2">
          <DotsThreeOutlineIcon size={20} weight="fill" className="text-clx-icon-default" />
        </button>
      </div>

      {/* Team cards */}
      <div className="bg-clx-bg-neutral-bold rounded-lg p-6">
        <div className="flex items-center justify-between">
          {/* Team A */}
          <div className="flex flex-col gap-3 w-[120px]">
            {match.teamA.map((player, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="bg-orange-50 flex items-center justify-center rounded-full size-6">
                  <UserIcon size={12} weight="fill" className="text-orange-500" />
                </div>
                <span className="text-base text-clx-text-default truncate">{player}</span>
              </div>
            ))}
          </div>

          {/* VS */}
          <span className="text-base text-clx-text-placeholder">v.s</span>

          {/* Team B */}
          <div className="flex flex-col gap-3 items-end w-[120px]">
            {match.teamB.map((player, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-base text-clx-text-default truncate">{player}</span>
                <div className="bg-orange-50 flex items-center justify-center rounded-full size-6">
                  <UserIcon size={12} weight="fill" className="text-orange-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
