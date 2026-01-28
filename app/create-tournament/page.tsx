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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PlusIcon, XIcon, DotsThreeIcon, PencilSimpleIcon, GenderMaleIcon, GenderFemaleIcon } from "@phosphor-icons/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  Field,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import { createTournamentSchema, type CreateTournamentFormData, type MixPlayerFormData } from "@/utils/form-schemas";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// SVG imports for team type icons
import thunderIcon from "../../public/thunder.svg";
import chartIcon from "../../public/charts.svg";
import upIcon from "../../public/Up.svg";
import { saveTournament, TeamType, Gender } from "@/utils/tournament";
import { saveMixAmericanoTournament, MIX_AMERICANO_REQUIRED_PLAYERS, MIX_AMERICANO_REQUIRED_MEN, MIX_AMERICANO_REQUIRED_WOMEN } from "@/utils/MixAmericanoTournament";

// Team type options with descriptions matching Figma design
const teamTypes = [
  {
    id: "standard",
    name: "Americano",
    description: "A format where you play with different partners every round.",
    icon: chartIcon
  },
  {
    id: "mix",
    name: "Mix Americano",
    description: "The standard format specifically designed for mixed-gender pairs (man & woman).",
    icon: thunderIcon
  },
  {
    id: "team",
    name: "Team Americano",
    description: "Fixed partner for the entire tournament use team score point.",
    icon: upIcon
  },
];

// Point match options
const pointOptions = [
  { id: "21", label: "21 points" },
  { id: "16", label: "16 points" },
  { id: "best4", label: "Best of 4" },
  { id: "best5", label: "Best of 5" },
];

// Mix Americano player type
interface MixPlayer {
  name: string;
  gender: Gender;
}

export default function CreateTournament() {
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [playerInput, setPlayerInput] = useState("");
  const [playerInputError, setPlayerInputError] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPlayerIndex, setEditingPlayerIndex] = useState<number | null>(null);
  const [editingPlayerName, setEditingPlayerName] = useState("");
  const [openPopoverIndex, setOpenPopoverIndex] = useState<number | null>(null);

  // Mix Americano specific state - players with gender
  const [mixPlayers, setMixPlayers] = useState<MixPlayer[]>([]);
  const [mixPlayerValidationError, setMixPlayerValidationError] = useState("");

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
  const teamType = watch("teamType");
  const isMixAmericano = teamType === "mix";

  // Calculate gender counts for Mix Americano
  const menCount = mixPlayers.filter(p => p.gender === "male").length;
  const womenCount = mixPlayers.filter(p => p.gender === "female").length;

  // Validate Mix Americano requirements (called on form submit)
  const validateMixAmericano = (): { valid: boolean; error?: string } => {
    if (!isMixAmericano) return { valid: true };

    // No players added
    if (mixPlayers.length === 0) {
      return {
        valid: false,
        error: "Please add players",
      };
    }

    // Check for exactly 4 men and 4 women
    if (menCount !== MIX_AMERICANO_REQUIRED_MEN || womenCount !== MIX_AMERICANO_REQUIRED_WOMEN) {
      return {
        valid: false,
        error: `Requires ${MIX_AMERICANO_REQUIRED_MEN} men and ${MIX_AMERICANO_REQUIRED_WOMEN} women.`,
      };
    }

    return { valid: true };
  };

  const onSubmit = (data: CreateTournamentFormData) => {
    if (isMixAmericano) {
      // Validate Mix Americano requirements
      const validation = validateMixAmericano();
      if (!validation.valid) {
        setMixPlayerValidationError(validation.error || "Invalid configuration");
        return;
      }

      // Clear any previous error
      setMixPlayerValidationError("");

      // Save Mix Americano tournament
      const result = saveMixAmericanoTournament({
        name: data.tournamentName,
        pointType: data.pointType,
        players: mixPlayers,
      });

      if (result) {
        toast.success(`Tournament "${data.tournamentName}" created with ${mixPlayers.length} players!`);
        router.push("/");
      } else {
        toast.error("Failed to create tournament");
      }
    } else {
      // Save standard tournament
      saveTournament({
        name: data.tournamentName,
        teamType: data.teamType as TeamType,
        pointType: data.pointType,
        players: data.players,
      });
      toast.success(`Tournament "${data.tournamentName}" created with ${data.players.length} players!`);
      router.push("/");
    }
  };

  // Handle form validation errors - show Mix Americano specific error when players validation fails
  const onFormError = () => {
    if (isMixAmericano) {
      // Run Mix Americano validation to show appropriate error
      const validation = validateMixAmericano();
      if (!validation.valid) {
        setMixPlayerValidationError(validation.error || "Invalid configuration");
      }
    }
  };

  const handleCancel = () => {
    router.push("/");
  };

  const handleAddPlayers = () => {
    if (!playerInput.trim()) return;

    // Split by comma or newline, trim whitespace, filter empty strings
    const newPlayerNames = playerInput
      .split(/[,\n]/)
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    if (newPlayerNames.length > 0) {
      // Check for duplicates within the new input
      const lowerCaseNewPlayers = newPlayerNames.map(name => name.toLowerCase());
      const uniqueNewPlayers = new Set(lowerCaseNewPlayers);
      if (uniqueNewPlayers.size !== newPlayerNames.length) {
        setPlayerInputError("Duplicate names found in input. Each player must have a unique name.");
        return;
      }

      if (isMixAmericano) {
        // Mix Americano: Check max limit of 8
        const totalPlayers = mixPlayers.length + newPlayerNames.length;
        if (totalPlayers > MIX_AMERICANO_REQUIRED_PLAYERS) {
          setPlayerInputError(`Mix Americano only available for ${MIX_AMERICANO_REQUIRED_PLAYERS} players.`);
          return;
        }

        // Check for duplicates with existing players
        const existingLowerCase = mixPlayers.map(p => p.name.toLowerCase());
        const duplicates = newPlayerNames.filter(name => existingLowerCase.includes(name.toLowerCase()));
        if (duplicates.length > 0) {
          setPlayerInputError(`Player "${duplicates[0]}" already exists. Each player must have a unique name.`);
          return;
        }

        // Add new players with default gender as male
        const newMixPlayers: MixPlayer[] = newPlayerNames.map(name => ({
          name,
          gender: "male" as Gender,
        }));

        setMixPlayers([...mixPlayers, ...newMixPlayers]);
        // Also update the form players array for form validation
        setValue("players", [...mixPlayers.map(p => p.name), ...newPlayerNames], { shouldValidate: true });
      } else {
        // Standard Americano
        // Check for duplicates with existing players
        const existingLowerCase = players.map(name => name.toLowerCase());
        const duplicates = newPlayerNames.filter(name => existingLowerCase.includes(name.toLowerCase()));
        if (duplicates.length > 0) {
          setPlayerInputError(`Player "${duplicates[0]}" already exists. Each player must have a unique name.`);
          return;
        }

        // Clear error if validation passes
        setPlayerInputError("");

        const totalPlayers = players.length + newPlayerNames.length;

        // Check if adding these players would exceed max limit
        if (totalPlayers > 10) {
          setPlayerInputError(`Maximum 10 players allowed. You already have (${players.length} players).`);
          return;
        }

        setValue("players", [...players, ...newPlayerNames], { shouldValidate: true });
      }

      setPlayerInputError("");
      setPlayerInput("");
      //toast.success(`Added ${newPlayerNames.length} player(s)!`);
    }
  };

  const handleDeletePlayer = (index: number) => {
    if (isMixAmericano) {
      const playerName = mixPlayers[index].name;
      const updatedMixPlayers = mixPlayers.filter((_, i) => i !== index);
      setMixPlayers(updatedMixPlayers);
      setValue("players", updatedMixPlayers.map(p => p.name), { shouldValidate: true });
      toast.success(playerName + " removed");
    } else {
      const playerName = players[index];
      const updatedPlayers = players.filter((_, i) => i !== index);
      setValue("players", updatedPlayers, { shouldValidate: true });
      toast.success(playerName + " removed");
    }
  };

  const handleEditPlayer = (index: number) => {
    if (isMixAmericano) {
      const player = mixPlayers[index];
      setEditingPlayerIndex(index);
      setEditingPlayerName(player.name);
    } else {
      const playerName = players[index];
      setEditingPlayerIndex(index);
      setEditingPlayerName(playerName);
    }
    setEditDialogOpen(true);
  };

  const handleSaveEditPlayer = () => {
    if (editingPlayerIndex === null) return;

    const trimmedName = editingPlayerName.trim();
    if (!trimmedName) {
      toast.error("Player name cannot be empty");
      return;
    }

    if (isMixAmericano) {
      // Check if the new name already exists (excluding the current player)
      const otherPlayers = mixPlayers.filter((_, i) => i !== editingPlayerIndex);
      const isDuplicate = otherPlayers.some(p => p.name.toLowerCase() === trimmedName.toLowerCase());
      if (isDuplicate) {
        toast.error(`Player "${trimmedName}" already exists. Each player must have a unique name.`);
        return;
      }

      const updatedMixPlayers = [...mixPlayers];
      updatedMixPlayers[editingPlayerIndex] = {
        ...updatedMixPlayers[editingPlayerIndex],
        name: trimmedName,
      };
      setMixPlayers(updatedMixPlayers);
      setValue("players", updatedMixPlayers.map(p => p.name), { shouldValidate: true });
    } else {
      // Check if the new name already exists (excluding the current player)
      const otherPlayers = players.filter((_, i) => i !== editingPlayerIndex);
      const isDuplicate = otherPlayers.some(p => p.toLowerCase() === trimmedName.toLowerCase());
      if (isDuplicate) {
        toast.error(`Player "${trimmedName}" already exists. Each player must have a unique name.`);
        return;
      }

      const updatedPlayers = [...players];
      updatedPlayers[editingPlayerIndex] = trimmedName;
      setValue("players", updatedPlayers, { shouldValidate: true });
    }

    toast.success("Player name updated");
    setEditDialogOpen(false);
    setEditingPlayerIndex(null);
    setEditingPlayerName("");
  };

  // Toggle player gender (Mix Americano only)
  const handleToggleGender = (index: number) => {
    const updatedMixPlayers = [...mixPlayers];
    updatedMixPlayers[index] = {
      ...updatedMixPlayers[index],
      gender: updatedMixPlayers[index].gender === "male" ? "female" : "male",
    };
    setMixPlayers(updatedMixPlayers);
  };

  // Reset players when switching team types
  const handleTeamTypeChange = (newTeamType: string) => {
    setValue("teamType", newTeamType);
    // Clear players when switching between standard and mix
    if ((newTeamType === "mix" && teamType !== "mix") || (newTeamType !== "mix" && teamType === "mix")) {
      setValue("players", []);
      setMixPlayers([]);
      setPlayerInputError("");
    }
  };

  // Get men and women players for display
  const menPlayers = mixPlayers.filter(p => p.gender === "male");
  const womenPlayers = mixPlayers.filter(p => p.gender === "female");

  return (
    <main className="min-w-[393px] h-full">
      <AppBarDetail />

      {/* Main content */}
      <div className="container">
        <form onSubmit={handleSubmit(onSubmit, onFormError)}>
          <FieldGroup className="h-auto">
            <div className="flex-1 p-4 space-y-7">
              {/* Tournament name input */}
              <Field>
                <div className="grid w-full items-center gap-1">
                  <Label htmlFor="tournament-name" className="text-base font-semibold text-clx-text-default">
                    Name
                  </Label>
                  <Controller
                    name="tournamentName"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="text"
                        id="tournament-name"
                        placeholder="e.g Padelhaus tournament"
                        maxLength={64}
                        className={`h-11 text-base placeholder:text-clx-text-placeholder ${errors.tournamentName ? "border-clx-border-danger-bold" : "border-clx-border-textfield"}`}
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
                <div className="space-y-3">
                  <div>
                    <p className="text-base font-semibold text-clx-text-default tracking-[0.2px]">Gameplay</p>
                    <p className="text-xs text-clx-text-secondary">Set tournament team pairing</p>
                  </div>
                  <Controller
                    name="teamType"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleTeamTypeChange(value);
                        }}
                        className="flex flex-col gap-2"
                      >
                        {teamTypes.map((team) => {
                          const isSelected = field.value === team.id;
                          return (
                            <label
                              key={team.id}
                              htmlFor={`team-${team.id}`}
                              className={`flex items-center gap-5 px-4 py-3 rounded-lg border cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-clx-bg-neutral-bold border-neutral-200"
                                  : "bg-white border-neutral-200"
                              }`}
                            >
                              <Image
                                src={team.icon}
                                width={27}
                                height={24}
                                alt={team.name}
                                className="shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-clx-text-default leading-5 tracking-[0.2px]">
                                  {team.name}
                                </p>
                                <p className="text-xs text-clx-text-secondary leading-[18px]">
                                  {team.description}
                                </p>
                              </div>
                              <RadioGroupItem
                                value={team.id}
                                id={`team-${team.id}`}
                                className={`shrink-0 size-4 border ${
                                  isSelected
                                    ? "border-clx-border-accent-bold bg-clx-bg-accent text-white"
                                    : "border-clx-border-textfield bg-white"
                                }`}
                              />
                            </label>
                          );
                        })}
                      </RadioGroup>
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
                            <Badge
                              key={point.id}
                              variant="outline"
                              onClick={() => field.onChange(point.id)}
                              className={`shrink-0 whitespace-nowrap px-3 py-1.5 h-auto text-sm cursor-pointer ${
                                isSelected
                                  ? "bg-clx-bg-neutral-bold text-clx-text-default font-semibold border-neutral-200"
                                  : "bg-white text-clx-text-secondary font-normal border-neutral-200 hover:bg-clx-bg-neutral-hover"
                              }`}
                            >
                              {point.label}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  />
                </div>
              </Field>

              {/* Players section */}
              <Field>
                <div className="space-y-4 pb-20 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-semibold text-clx-text-default">Players</p>
                      <p className="text-sm text-clx-text-dark-subtle">
                        <span className="text-xs">Total {isMixAmericano ? mixPlayers.length : players.length} players added</span>
                      </p>
                    </div>
                    <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} modal={true}>
                      <DrawerTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 px-4! border-clx-border-textfield rounded-lg gap-2 text-base pl-3!"
                        >
                          {/* 1. Toggle the Icon */}
                          {(isMixAmericano ? mixPlayers.length : players.length) > 0 ? (
                            <PencilSimpleIcon size={16} className="text-clx-text-default w-auto! h-auto!" />
                          ) : (
                            <PlusIcon size={16} className="text-clx-text-default w-auto! h-auto!" />
                          )}

                          {/* 2. Toggle the Text */}
                          <span className="font-bold text-clx-text-default">
                            {(isMixAmericano ? mixPlayers.length : players.length) > 0 ? "Edit" : "Add"}
                          </span>
                        </Button>
                      </DrawerTrigger>
                      <DrawerContent className="rounded-none!" showHandle={true}>
                        <DrawerHeader className="border-b border-neutral-100 px-4 pb-3 pt-0 shrink-0 h-0">
                          <div className="flex items-center justify-between invisible">
                            <div className="flex items-center gap-3">
                              <DrawerClose asChild>
                                <button type="button" className="text-clx-icon-default">
                                  <XIcon size={24} />
                                </button>
                              </DrawerClose>
                              <DrawerTitle className="text-lg font-bold text-clx-text-default">
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
                                Total: <span className="text-clx-text-default">{isMixAmericano ? mixPlayers.length : players.length} players</span>
                              </p>
                            </div>

                            {/* Mix Americano: Show gender counts */}
                            {isMixAmericano && mixPlayers.length > 0 && (
                              <div className="flex gap-4 text-sm">
                                <p>
                                  <span className="text-clx-text-accent">Men</span>
                                  <span className="text-clx-text-secondary">: </span>
                                  <span className="text-clx-text-default">{menCount}</span>
                                </p>
                                <p>
                                  <span className="text-red-500">Women</span>
                                  <span className="text-clx-text-secondary">: </span>
                                  <span className="text-clx-text-default">{womenCount}</span>
                                </p>
                              </div>
                            )}

                            {(isMixAmericano ? mixPlayers.length : players.length) === 0 ? (
                              <div className="py-20 text-center">
                                <p className="text-sm text-clx-text-placeholder">No players added yet</p>
                              </div>
                            ) : isMixAmericano ? (
                              // Mix Americano player list with gender toggle
                              <div className="flex flex-col gap-2">
                                {mixPlayers.map((player, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-3 h-12 px-4 py-2 bg-clx-bg-neutral-subtle rounded-md border-0"
                                  >
                                    <span className="text-sm text-clx-text-placeholder">{index + 1}.</span>
                                    <span className="flex-1 text-sm font-semibold text-clx-text-default truncate">
                                      {player.name}
                                    </span>
                                    {/* Gender toggle button */}
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="size-8 rounded-lg border-clx-border-default bg-white"
                                      onClick={() => handleToggleGender(index)}
                                    >
                                      {player.gender === "male" ? (
                                        <GenderMaleIcon size={20} weight="regular" className="text-clx-text-accent" />
                                      ) : (
                                        <GenderFemaleIcon size={20} weight="regular" className="text-red-500" />
                                      )}
                                    </Button>
                                    <Popover
                                      open={openPopoverIndex === index}
                                      onOpenChange={(open) => setOpenPopoverIndex(open ? index : null)}
                                    >
                                      <PopoverTrigger asChild>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className={`size-8 rounded-lg ${openPopoverIndex === index ? "bg-neutral-200" : "bg-transparent hover:bg-clx-bg-neutral-hover"}`}
                                        >
                                          <DotsThreeIcon size={24} weight="bold" className="text-clx-text-default w-auto! h-auto!" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent
                                        align="end"
                                        className="w-[104px] p-0 py-2 rounded-md shadow-lg border border-[#e1e0e0]"
                                      >
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenPopoverIndex(null);
                                            handleEditPlayer(index);
                                          }}
                                          className="w-full px-3 py-2 text-left text-sm text-clx-text-default hover:bg-clx-bg-neutral-subtle"
                                        >
                                          Edit name
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenPopoverIndex(null);
                                            handleDeletePlayer(index);
                                          }}
                                          className="w-full px-3 py-2 text-left text-sm text-clx-text-danger hover:bg-clx-bg-neutral-subtle"
                                        >
                                          Remove
                                        </button>
                                      </PopoverContent>
                                    </Popover>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              // Standard Americano player list
                              <div className="flex flex-col gap-2">
                                {players.map((player, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-3 h-12 px-4 py-2 bg-clx-bg-neutral-subtle rounded-md border-0"
                                  >
                                    <span className="text-sm text-clx-text-placeholder">{index + 1}.</span>
                                    <span className="flex-1 text-sm font-semibold text-clx-text-default truncate">
                                      {player}
                                    </span>
                                    <Popover
                                      open={openPopoverIndex === index}
                                      onOpenChange={(open) => setOpenPopoverIndex(open ? index : null)}
                                    >
                                      <PopoverTrigger asChild>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className={`size-8 rounded-lg ${openPopoverIndex === index ? "bg-neutral-200" : "bg-transparent hover:bg-clx-bg-neutral-hover"}`}
                                        >
                                          <DotsThreeIcon size={24} weight="bold" className="text-clx-text-default w-auto! h-auto!" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent
                                        align="end"
                                        className="w-[104px] p-0 py-2 rounded-md shadow-lg border border-[#e1e0e0]"
                                      >
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenPopoverIndex(null);
                                            handleEditPlayer(index);
                                          }}
                                          className="w-full px-3 py-2 text-left text-sm text-clx-text-default hover:bg-clx-bg-neutral-subtle"
                                        >
                                          Edit name
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenPopoverIndex(null);
                                            handleDeletePlayer(index);
                                          }}
                                          className="w-full px-3 py-2 text-left text-sm text-clx-text-danger hover:bg-clx-bg-neutral-subtle"
                                        >
                                          Remove
                                        </button>
                                      </PopoverContent>
                                    </Popover>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </DrawerContent>
                    </Drawer>
                  </div>

                  {/* Validation errors */}
                  {errors.players && !isMixAmericano && (
                    <div className="w-auto text-center">
                      <p className="text-sm text-clx-text-danger">{errors.players.message}</p>
                    </div>
                  )}

                  {/* Mix Americano validation error - only shown after clicking Create */}
                  {mixPlayerValidationError && isMixAmericano && (
                    <div className="w-auto text-center">
                      <p className="text-sm text-clx-text-danger">{mixPlayerValidationError}</p>
                    </div>
                  )}

                  {/* Standard Americano: simple badge display */}
                  {!isMixAmericano && players.length > 0 && (
                    <div className="flex gap-2 w-full flex-wrap">
                      {players.map((player, index) => (
                        <Badge key={index} className="text-sm min-w-[62px] font-normal px-3 py-1 rounded-sm bg-clx-bg-neutral-bold border-0" variant="outline">{player}</Badge>
                      ))}
                    </div>
                  )}

                  {/* Mix Americano: Grouped by gender display */}
                  {isMixAmericano && mixPlayers.length > 0 && (
                    <div className="space-y-6">
                      {/* Men section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-50 px-2 py-1 rounded">
                            <GenderMaleIcon size={16} className="text-clx-text-accent" />
                          </div>
                          <span className="text-sm text-clx-text-default">Men ({menCount})</span>
                        </div>
                        <div className="flex gap-2 w-full flex-wrap">
                          {menPlayers.map((player, index) => (
                            <Badge key={index} className="text-sm min-w-[62px] font-normal px-3 py-1 rounded-sm bg-clx-bg-neutral-bold border-0" variant="outline">
                              {player.name}
                            </Badge>
                          ))}
                          {menCount === 0 && (
                            <span className="text-sm text-clx-text-placeholder">No men added</span>
                          )}
                        </div>
                      </div>

                      {/* Women section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="bg-red-50 px-2 py-1 rounded">
                            <GenderFemaleIcon size={16} className="text-red-500" />
                          </div>
                          <span className="text-sm text-clx-text-default">Women ({womenCount})</span>
                        </div>
                        <div className="flex gap-2 w-full flex-wrap">
                          {womenPlayers.map((player, index) => (
                            <Badge key={index} className="text-sm min-w-[62px] font-normal px-3 py-1 rounded-sm bg-clx-bg-neutral-bold border-0" variant="outline">
                              {player.name}
                            </Badge>
                          ))}
                          {womenCount === 0 && (
                            <span className="text-sm text-clx-text-placeholder">No women added</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
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
                className="w-full text-base h-12 bg-clx-bg-accent text-white font-bold rounded-lg hover:bg-blue-700 active:bg-blue-700"
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

      {/* Edit Player Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent showCloseButton={false} className="w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle>Edit player name</DialogTitle>
          </DialogHeader>
          <Input
            value={editingPlayerName}
            onChange={(e) => setEditingPlayerName(e.target.value)}
            placeholder="Enter player name"
            className="h-11 text-base"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSaveEditPlayer();
              }
            }}
          />
          <DialogFooter className="flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-11"
              onClick={() => setEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1 h-11 bg-clx-bg-accent text-white"
              onClick={handleSaveEditPlayer}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
