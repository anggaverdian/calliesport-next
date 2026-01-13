"use client";

import { Trophy } from "@phosphor-icons/react";

interface WinnerBannerProps {
  playerName: string;
  wins: number;
  losses: number;
  ties: number;
}

export default function WinnerBanner({ playerName, wins, losses, ties }: WinnerBannerProps) {
  return (
    <div className="flex items-center gap-4 h-12 px-4 bg-amber-400">
      <Trophy size={24} weight="fill" className="text-clx-text-default shrink-0" />
      <p className="flex-1 text-sm text-clx-text-default">
        <span className="font-semibold">{playerName}</span>
        <span> is in 1st place!</span>
      </p>
      <div className="flex items-center gap-2 text-clx-text-default shrink-0">
        <span className="text-xs">W-L-T:</span>
        <span className="text-sm">{wins}-{losses}-{ties}</span>
      </div>
    </div>
  );
}
