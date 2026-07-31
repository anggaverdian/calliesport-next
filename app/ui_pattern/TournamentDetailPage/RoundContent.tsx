"use client";

import ScoreCard from "./ScoreCard";
import { Match } from "@/utils/tournament";

interface RoundContentProps {
  matches: Match[];
  restingPlayers: string[];
  onScoreClick: (matchIndex: number, team: "A" | "B") => void;
}

export default function RoundContent({
  matches,
  restingPlayers,
  onScoreClick,
}: RoundContentProps) {
  return (
    <>
      {/* One score card per court */}
      {matches.map((match, index) => (
        <ScoreCard
          key={match.id}
          match={match}
          courtLabel={`Court ${index + 1}`}
          onScoreClickA={() => onScoreClick(index, "A")}
          onScoreClickB={() => onScoreClick(index, "B")}
        />
      ))}

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
