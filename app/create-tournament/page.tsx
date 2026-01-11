"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppBarDetail from "../ui_pattern/AppBar/AppBarDetail";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import Image from "next/image";

// SVG imports for team type icons
import thunderIcon from "../../public/thunder.svg";
import chartIcon from "../../public/Chart.svg";
import upIcon from "../../public/Up.svg";
import starIcon from "../../public/Star.svg";

// Team type options
const teamTypes = [
  { id: "standard", name: "Standard", subname: "Americano", icon: thunderIcon },
  { id: "mix", name: "Mix", subname: "Americano", icon: chartIcon },
  { id: "team", name: "Team", subname: "Americano", icon: upIcon },
  { id: "mexicano", name: "Standard", subname: "Mexicano", icon: starIcon },
];

// Point match options
const pointOptions = [
  { id: "21", label: "21 points" },
  { id: "16", label: "16 points" },
  { id: "best4", label: "Best of 4" },
  { id: "best5", label: "Best of 5" },
];

export default function CreateTournament() {
  const router = useRouter();
  const [tournamentName, setTournamentName] = useState("");
  const [selectedTeamType, setSelectedTeamType] = useState("standard");
  const [selectedPointType, setSelectedPointType] = useState("21");
  const [players, setPlayers] = useState<string[]>([]);

  const handleCreate = () => {
    // TODO: Save to database later
    toast.success("Tournament created successfully!");
    router.push("/");
  };

  const handleCancel = () => {
    router.push("/");
  };

  return (
    <main className="container w-auto flex flex-col min-h-screen">
      <AppBarDetail />

      {/* Main content */}
      <div className="flex-1 p-4 space-y-6 ">
        {/* Tournament name input */}
        <div className="grid w-full items-center gap-1">
          <Label htmlFor="tournament-name" className="text-base font-semibold text-clx-text-default">
            Tournament name
          </Label>
          <Input
            type="text"
            id="tournament-name"
            placeholder=""
            className="h-11 text-base border-clx-border-textfield"
            value={tournamentName}
            onChange={(e) => setTournamentName(e.target.value)}
          />
        </div>

        {/* Team type selection */}
        <div className="space-y-2">
          <div  className="pb-2">
            <p className="text-base font-semibold text-clx-text-default">Which team up you want to play?</p>
            <p className="text-xs text-clx-text-dark-subtle">Determine your team pairing</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {teamTypes.map((team) => {
              const isSelected = selectedTeamType === team.id;
              return (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeamType(team.id)}
                  className={`flex flex-col items-center justify-center gap-3 min-w-[116px] h-[148px] px-4 py-6 rounded-lg transition-all ${
                    isSelected
                      ? "bg-clx-bg-accent-surface border border-clx-border-accent-bold"
                      : "bg-clx-bg-neutral-bold"
                  }`}
                >
                  <Image
                    src={team.icon}
                    width={48}
                    height={48}
                    alt={`${team.name} ${team.subname}`}
                  />
                  <div className="text-center">
                    <p className={`text-sm ${isSelected ? "font-medium" : "font-normal"} text-clx-text-default`}>
                      {team.name}
                    </p>
                    <p className={`text-sm ${isSelected ? "font-medium" : "font-normal"} text-clx-text-default`}>
                      {team.subname}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Point match selection */}
        <div className="space-y-4">
          <div>
            <p className="text-base font-semibold text-clx-text-default">Point match</p>
            <p className="text-xs text-clx-text-dark-subtle">Which point match do you want to play?</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {pointOptions.map((point) => {
              const isSelected = selectedPointType === point.id;
              return (
                <button
                  key={point.id}
                  onClick={() => setSelectedPointType(point.id)}
                  className={`shrink-0 whitespace-nowrap px-4 py-2 h-9 rounded-full text-sm transition-all ${
                    isSelected
                      ? "bg-clx-bg-dark text-clx-text-white font-semibold border-0"
                      : "bg-clx-bg-neutral-bold text-clx-text-default font-normal border-0"
                  }`}
                >
                  {point.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Players section */}
        <div className="space-y-4 pb-8 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-clx-text-default">Players</h2>
              <p className="text-xs text-clx-text-default">
                Total <span className="font-medium">{players.length} players</span> added
              </p>
            </div>
            <Button
              variant="outline"
              className="h-11 px-4! border-clx-border-textfield rounded-lg gap-1 text-base"
              onClick={() => {
                // TODO: Navigate to add players page later
                toast.info("Add players feature coming soon!");
              }}
            >
              <PlusIcon size={24} className="text-clx-text-default" />
              <span className="font-bold text-clx-text-default">Add</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Action buttons - fixed at bottom */}
      <div className="p-3 space-y-2">
        <Button
          className="w-full text-base h-12 bg-clx-bg-accent text-white font-bold rounded-lg hover:bg-clx-bg-accent/90"
          onClick={handleCreate}
        >
          Create
        </Button>
        <Button
          variant="ghost"
          className="w-full h-12 text-clx-text-secondary font-medium rounded-lg"
          onClick={handleCancel}
        >
          Cancel
        </Button>
      </div>
    </main>
  );
}
