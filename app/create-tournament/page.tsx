"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AppBarDetail from "../ui_pattern/AppBar/AppBarDetail";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { PlusIcon, XIcon, PencilSimpleIcon, MinusCircleIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  Field,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import { createTournamentSchema, type CreateTournamentFormData } from "@/utils/form-schemas";

// SVG imports for team type icons
import thunderIcon from "../../public/thunder.svg";
import chartIcon from "../../public/Chart.svg";
import upIcon from "../../public/Up.svg";
import starIcon from "../../public/Star.svg";
import { saveTournament, TeamType } from "@/utils/tournament";

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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [playerInput, setPlayerInput] = useState("");
  const [playerInputError, setPlayerInputError] = useState("");

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateTournamentFormData>({
    resolver: zodResolver(createTournamentSchema),
    defaultValues: {
      tournamentName: "",
      teamType: "standard",
      pointType: "21",
      players: [],
    },
  });

  const players = watch("players");

  const onSubmit = (data: CreateTournamentFormData) => {
    // Save to localStorage
    saveTournament({
      name: data.tournamentName,
      teamType: data.teamType as TeamType,
      pointType: data.pointType,
      players: data.players,
    });
    toast.success(`Tournament "${data.tournamentName}" created with ${data.players.length} players!`);
    router.push("/");
  };

  const handleCancel = () => {
    router.push("/");
  };

  const handleAddPlayers = () => {
    if (!playerInput.trim()) return;

    // Split by comma or newline, trim whitespace, filter empty strings
    const newPlayers = playerInput
      .split(/[,\n]/)
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    if (newPlayers.length > 0) {
      // Check for duplicates within the new input
      const lowerCaseNewPlayers = newPlayers.map(name => name.toLowerCase());
      const uniqueNewPlayers = new Set(lowerCaseNewPlayers);
      if (uniqueNewPlayers.size !== newPlayers.length) {
        setPlayerInputError("Duplicate names found in input. Each player must have a unique name.");
        return;
      }

      // Check for duplicates with existing players
      const existingLowerCase = players.map(name => name.toLowerCase());
      const duplicates = newPlayers.filter(name => existingLowerCase.includes(name.toLowerCase()));
      if (duplicates.length > 0) {
        setPlayerInputError(`Player "${duplicates[0]}" already exists. Each player must have a unique name.`);
        return;
      }

      // Clear error if validation passes
      setPlayerInputError("");

      const totalPlayers = players.length + newPlayers.length;

      // Check if adding these players would exceed max limit
      if (totalPlayers > 12) {
        const canAdd = 12 - players.length;
        if (canAdd <= 0) {
          toast.error("Maximum 12 players allowed");
          return;
        }
        // Only add up to the limit
        const playersToAdd = newPlayers.slice(0, canAdd);
        setValue("players", [...players, ...playersToAdd], { shouldValidate: true });
        setPlayerInput("");
        toast.success(`Added ${playersToAdd.length} player(s). Maximum 12 players reached.`);
        return;
      }

      setValue("players", [...players, ...newPlayers], { shouldValidate: true });
      setPlayerInput("");
      toast.success(`Added ${newPlayers.length} player(s)!`);
    }
  };

  const handleDeletePlayer = (index: number) => {
    const playerName = players[index];
    const updatedPlayers = players.filter((_, i) => i !== index);
    setValue("players", updatedPlayers, { shouldValidate: true });
    toast.success(playerName + " removed");
  };

  const handleEditPlayer = (index: number) => {
    const playerName = players[index];
    const newName = prompt("Edit player name:", playerName);
    if (newName && newName.trim() !== "") {
      const trimmedName = newName.trim();
      // Check if the new name already exists (excluding the current player)
      const otherPlayers = players.filter((_, i) => i !== index);
      const isDuplicate = otherPlayers.some(p => p.toLowerCase() === trimmedName.toLowerCase());
      if (isDuplicate) {
        toast.error(`Player "${trimmedName}" already exists. Each player must have a unique name.`);
        return;
      }
      const updatedPlayers = [...players];
      updatedPlayers[index] = trimmedName;
      setValue("players", updatedPlayers, { shouldValidate: true });
      toast.success("Player name updated");
    }
  };

  return (
    <main className="w-auto min-h-screen">
      <AppBarDetail />

      {/* Main content */}
      <div className="container">
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <div className="flex-1 p-4 space-y-6">
              {/* Tournament name input */}
              <Field>
                <div className="grid w-full items-center gap-1">
                  <Label htmlFor="tournament-name" className="text-base font-semibold text-clx-text-default">
                    Tournament name
                  </Label>
                  <Controller
                    name="tournamentName"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="text"
                        id="tournament-name"
                        placeholder=""
                        maxLength={64}
                        className={`h-11 text-base ${errors.tournamentName ? "border-clx-border-danger-bold" : "border-clx-border-textfield"}`}
                      />
                    )}
                  />
                  {errors.tournamentName && (
                    <FieldError className="text-sm text-clx-text-danger">{errors.tournamentName.message}</FieldError>
                  )}
                </div>
              </Field>

              {/* Team type selection */}
              <Field>
                <div className="space-y-2">
                  <div className="pb-2">
                    <p className="text-base font-semibold text-clx-text-default">Which team up you want to play?</p>
                    <p className="text-xs text-clx-text-dark-subtle">Determine your team pairing</p>
                  </div>
                  <Controller
                    name="teamType"
                    control={control}
                    render={({ field }) => (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {teamTypes.map((team) => {
                          const isSelected = field.value === team.id;
                          return (
                            <button
                              type="button"
                              key={team.id}
                              onClick={() => field.onChange(team.id)}
                              className={`flex flex-col items-center justify-center gap-3 min-w-[116px] h-[148px] px-4 py-6 rounded-lg transition-all ${
                                isSelected
                                  ? "bg-clx-bg-accent-subtle border border-clx-border-accent-bold"
                                  : "bg-clx-bg-neutral-bold hover:bg-clx-bg-neutral-hover"
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
                    )}
                  />
                </div>
              </Field>

              {/* Point match selection */}
              <Field>
                <div className="space-y-4">
                  <div>
                    <p className="text-base font-semibold text-clx-text-default">Point match</p>
                    <p className="text-xs text-clx-text-dark-subtle">Which point match do you want to play?</p>
                  </div>
                  <Controller
                    name="pointType"
                    control={control}
                    render={({ field }) => (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {pointOptions.map((point) => {
                          const isSelected = field.value === point.id;
                          return (
                            <button
                              type="button"
                              key={point.id}
                              onClick={() => field.onChange(point.id)}
                              className={`shrink-0 whitespace-nowrap px-4 py-2 h-9 rounded-full text-sm transition-all ${
                                isSelected
                                  ? "bg-clx-bg-dark text-clx-text-white font-semibold border-0"
                                  : "bg-clx-bg-neutral-bold text-clx-text-default font-normal border-0 hover:bg-clx-bg-neutral-hover"
                              }`}
                            >
                              {point.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  />
                </div>
              </Field>

              {/* Players section */}
              <Field>
                <div className="space-y-4 pb-8 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl font-bold text-clx-text-default">Players</p>
                      <p className="text-sm text-clx-text-default">
                        Total <span className="font-medium">{players.length} players</span> added
                      </p>
                    </div>
                    <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} modal={true}>
                      <DrawerTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 px-4! border-clx-border-textfield rounded-lg gap-2 text-base pl-3.5!"
                        >
                          {/* 1. Toggle the Icon */}
                          {players.length > 0 ? (
                            <PencilSimpleIcon size={22} className="text-clx-text-default w-auto! h-auto!" />
                          ) : (
                            <PlusIcon size={22} className="text-clx-text-default w-auto! h-auto!" />
                          )}

                          {/* 2. Toggle the Text */}
                          <span className="font-bold text-clx-text-default">
                            {players.length > 0 ? "Edit" : "Add"}
                          </span>
                        </Button>
                      </DrawerTrigger>
                      <DrawerContent className="h-full max-h-screen rounded-none!" showHandle={false}>
                        <DrawerHeader className="border-b border-clx-border-default px-4 pb-4 pt-6 shrink-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <DrawerClose asChild>
                                <button type="button" className="text-clx-icon-default">
                                  <XIcon size={24} />
                                </button>
                              </DrawerClose>
                              <DrawerTitle className="text-xl font-bold text-clx-text-default">
                                Players
                              </DrawerTitle>
                            </div>
                            <DrawerClose asChild>
                              <button type="button" className="text-lg text-clx-text-accent font-normal">
                                Done
                              </button>
                            </DrawerClose>
                          </div>
                        </DrawerHeader>

                        <div className="flex-1 p-4 space-y-6 overflow-y-auto pb-24">
                          {/* Input section */}
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <Label className="text-base font-semibold text-clx-text-default">
                                Input player name
                              </Label>
                              <Textarea
                                placeholder="e.g callie, mayo, eckel, jojo"
                                className={`h-20 text-base resize-none ${playerInputError ? "border-clx-border-danger" : "border-clx-border-textfield"}`}
                                value={playerInput}
                                onChange={(e) => {
                                  setPlayerInput(e.target.value);
                                  if (playerInputError) setPlayerInputError("");
                                }}
                              />
                              {playerInputError && (
                                <p className="text-sm text-clx-text-danger">{playerInputError}</p>
                              )}
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <p className="text-sm text-clx-text-default">
                                Bulk add player names separated by commas or new lines.
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                className="h-10 px-4 pl-2! border-clx-border-textfield rounded-lg gap-2 shrink-0 disabled:opacity-50 disabled:bg-clx-bg-disabled"
                                onClick={handleAddPlayers}
                                disabled={!playerInput.trim()}
                              >
                                <PlusIcon size={24} className="text-clx-text-default" />
                                <span className="font-bold text-clx-text-default">Add</span>
                              </Button>
                            </div>
                          </div>

                          {/* Players list section */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-base font-semibold text-clx-text-default">Players list</p>
                              <p className="text-sm text-clx-text-secondary">
                                Total: <span className="text-clx-text-default">{players.length} players</span>
                              </p>
                            </div>

                            {players.length === 0 ? (
                              <div className="py-20 text-center">
                                <p className="text-sm text-clx-text-placeholder">No players added yet</p>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2">
                                {players.map((player, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-3 h-12 px-4 py-2 bg-clx-bg-neutral-bold rounded-md border-0"
                                  >
                                    <span className="text-sm text-clx-text-default">{index + 1}.</span>
                                    <span className="flex-1 text-sm font-semibold text-clx-text-default truncate">
                                      {player}
                                    </span>
                                    <div className="flex items-center gap-4">
                                      <button
                                        type="button"
                                        onClick={() => handleEditPlayer(index)}
                                        className="text-clx-icon-default hover:text-clx-icon-accent"
                                      >
                                        <PencilSimpleIcon size={20} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeletePlayer(index)}
                                        className="text-clx-icon-error hover:text-red-700"
                                      >
                                        <MinusCircleIcon size={20} weight="fill" className="text-clx-icon-danger" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </DrawerContent>
                    </Drawer>
                  </div>
                  {errors.players && (
                    <div className="w-auto text-center">
                      <p className="text-sm text-clx-text-danger">{errors.players.message}</p>
                    </div>
                  )}
                  <div className="flex gap-2.5 w-full flex-wrap">
                    {players.map((player, index) => (
                      <Badge key={index} className="text-base min-w-[62px] font-normal px-3 py-1 rounded-sm bg-clx-bg-neutral-bold border-0" variant="outline">{player}</Badge>
                    ))}
                  </div>
                </div>
              </Field>
            </div>
          </FieldGroup>

          {/* Action buttons - fixed at bottom */}
          <Field>
            <div className="p-3 space-y-2">
              <Button
                type="submit"
                variant={"default"}
                className="w-full text-base h-12 bg-clx-bg-accent text-white font-bold rounded-lg hover:bg-blue-700"
              >
                Create
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full h-12 text-clx-text-secondary font-medium rounded-lg"
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </div>
          </Field>
        </form>
      </div>
    </main>
  );
}
