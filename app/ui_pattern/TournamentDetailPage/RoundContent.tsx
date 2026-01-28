"use client";

import ScoreCard from "./ScoreCard";
import { Match } from "@/utils/tournament";

interface RoundContentProps {
  match: Match;
  restingPlayers: string[];
  onScoreClickA: () => void;
  onScoreClickB: () => void;
}

export default function RoundContent({
  match,
  restingPlayers,
  onScoreClickA,
  onScoreClickB,
}: RoundContentProps) {
  return (
    <>
      {/* Score card */}
      <ScoreCard
        match={match}
        onScoreClickA={onScoreClickA}
        onScoreClickB={onScoreClickB}
      />

      {/* Resting players */}
      {restingPlayers.length > 0 && (
        <div className="flex items-center justify-center gap-1.5 text-sm">
          <span className="font-semibold text-clx-text-default">Rest:</span>
          <span className="text-clx-text-secondary">
            {restingPlayers.join(", ")}
          </span>
        </div>
      )}
    </>
  );
}
