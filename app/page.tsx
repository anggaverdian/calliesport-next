"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppBarHome from "./ui_pattern/AppBar/AppBarHome";
import TournamentItem from "./ui_pattern/TournamentItem/TournamentItem";
import { PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import corgi_blank from "../public/calliecorgi.png";
import Link from "next/link";
import { Tournament, getTournaments, deleteTournament } from "@/utils/tournament";
import { toast } from "sonner";

export default function Home() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTournaments(getTournaments());
    setIsLoading(false);
  }, []);

  const handleView = (id: string) => {
    // TODO: Navigate to tournament detail page
    router.push(`/tournament/${id}`);
  };

  const handleDelete = (id: string) => {
    const tournament = tournaments.find((t) => t.id === id);
    deleteTournament(id);
    setTournaments(getTournaments());
    toast.success(`Tournament "${tournament?.name}" deleted`);
  };

  if (isLoading) {
    return (
      <main className="container w-auto">
        <AppBarHome />
        <div className="container p-4 py-20 text-center">
          <p className="text-clx-text-secondary">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container w-auto min-h-screen flex flex-col">
      <AppBarHome />

      {tournaments.length === 0 ? (
        // Empty state
        <div className="container p-4 space-y-6 text-center py-20">
          <div className="space-y-2">
            <div className="flex justify-center items-center">
              <Image src={corgi_blank} alt="logo blank" width={203} height={140} />
            </div>
            <div>
              <h3>No tournament yet</h3>
              <span className="text-sm text-clx-text-secondary">
                Your tournament will be displayed here
              </span>
            </div>
          </div>
          <Link href="/create-tournament">
            <Button
              size={"lg"}
              variant="default"
              className="bg-clx-bg-accent rounded-xl text-white font-bold py-5.5 pl-3! border-clx-bg-accent text-base active:bg-blue-700 active:scale-95 transition-all select-none"
            >
              <PlusIcon size={24} className="w-auto! h-auto!" />
              Create tournament
            </Button>
          </Link>
        </div>
      ) : (
        // Tournament list
        <>
          <div className="flex-1 p-4 space-y-3">
            {[...tournaments]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((tournament) => (
                <TournamentItem
                  key={tournament.id}
                  tournament={tournament}
                  onView={handleView}
                  onDelete={handleDelete}
                />
              ))}
          </div>

          {/* Floating create button */}
          <div className="fixed bottom-8 right-4 z-10">
            <Link href="/create-tournament">
              <Button
                size="lg"
                className="bg-clx-bg-accent text-base rounded-full text-white font-bold pl-4 pr-5 h-11 shadow-lg active:bg-blue-700 active:scale-95 transition-all select-none"
              >
                <PlusIcon size={20} className="w-auto! h-auto!" />
                Create
              </Button>
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
