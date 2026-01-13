"use client";

import { UserIcon } from "@phosphor-icons/react";
import { Match } from "@/utils/tournament";
import { DotsThreeOutlineIcon } from "@phosphor-icons/react";

interface ScoreCardProps {
  match: Match;
  onScoreClickA: () => void;
  onScoreClickB: () => void;
}

export default function ScoreCard({ match, onScoreClickA, onScoreClickB }: ScoreCardProps) {
  // Determine winner/loser when match is completed
  const isCompleted = match.isCompleted;
  const teamAWins = isCompleted && match.scoreA > match.scoreB;
  const teamBWins = isCompleted && match.scoreB > match.scoreA;

  // Score button styles
  const getScoreButtonStyle = (isWinner: boolean, isLoser: boolean) => {
    if (isWinner) {
      return "bg-clx-bg-success text-white";
    }
    if (isLoser) {
      return "bg-clx-bg-dark text-white";
    }
    // Default (not completed)
    return "bg-clx-bg-dark text-white";
  };

  // Avatar styles for winner/loser
  const getAvatarStyle = (isWinner: boolean) => {
    if (isWinner) {
      return "bg-orange-50";
    }
    // Loser or not completed uses neutral style when completed
    return "bg-white";
  };

  const getAvatarIconStyle = (isWinner: boolean) => {
    if (isWinner) {
      return "text-orange-500";
    }
    return "text-[#dcd8d5]";
  };

  const getPlayerTextStyle = (isWinner: boolean) => {
    if (isWinner) {
      return "text-clx-text-default";
    }
    return "text-clx-text-disabled";
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Score display */}
      <div className="flex items-center justify-center gap-1.5 space-x-16">
        <span className="text-sm text-clx-text-secondary">Court 1</span>
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={onScoreClickA}
            className={`flex flex-col items-center justify-center w-[52px] h-12 rounded-md ${getScoreButtonStyle(teamAWins, teamBWins)}`}
          >
            <span className="font-score! text-[28px] leading-7">
              {match.scoreA.toString().padStart(2, "0")}
            </span>
          </button>
          <span className="text-base font-semibold text-clx-text-placeholder">:</span>
          <button
            type="button"
            onClick={onScoreClickB}
            className={`flex flex-col items-center justify-center w-[52px] h-12 rounded-md ${getScoreButtonStyle(teamBWins, teamAWins)}`}
          >
            <span className="font-score! text-[28px] leading-7">
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
                <div className={`flex items-center justify-center rounded-full size-6 ${isCompleted ? getAvatarStyle(teamAWins) : "bg-orange-50"}`}>
                  <UserIcon size={12} weight="fill" className={isCompleted ? getAvatarIconStyle(teamAWins) : "text-orange-500"} />
                </div>
                <span className={`text-base truncate ${isCompleted ? getPlayerTextStyle(teamAWins) : "text-clx-text-default"}`}>{player}</span>
              </div>
            ))}
          </div>

          {/* VS */}
          <span className="text-base text-clx-text-placeholder">v.s</span>

          {/* Team B */}
          <div className="flex flex-col gap-3 items-end w-[120px]">
            {match.teamB.map((player, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className={`text-base truncate ${isCompleted ? getPlayerTextStyle(teamBWins) : "text-clx-text-default"}`}>{player}</span>
                <div className={`flex items-center justify-center rounded-full size-6 ${isCompleted ? getAvatarStyle(teamBWins) : "bg-orange-50"}`}>
                  <UserIcon size={12} weight="fill" className={isCompleted ? getAvatarIconStyle(teamBWins) : "text-orange-500"} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
