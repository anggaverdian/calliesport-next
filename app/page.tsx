"use client";
import AppBarHome from "./ui_pattern/AppBar/AppBarHome";
import { PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button"
import Image from "next/image";
import corgi_blank from "../public/calliecorgi.png";
import Link from "next/link";

export default function Home() {
  return (
      <main className="container w-auto">
            <AppBarHome />
            <div className="container p-4 space-y-6 text-center py-20">
               <div className="space-y-2">
                  <div className="flex justify-center items-center">
                     <Image src={corgi_blank} alt="logo blank" width={203} height={140} />
                  </div>
                  <div>
                        <h3>No tournament yet</h3>
                        <span className="text-sm text-clx-text-secondary">Your tournament will be displayed here</span>
                  </div>
               </div>
               <Link href="/create-tournament">
                  <Button size={"lg"} variant="outline" className="bg-clx-bg-accent rounded-xl text-white font-bold py-5.5 pl-3! border-clx-bg-accent text-base active:bg-blue-700 active:scale-95 transition-all select-none">
                     <PlusIcon size={24} className="w-auto! h-auto!"/>
                     Create tournament
                  </Button>
               </Link>
            </div>
      </main>
  );
}
