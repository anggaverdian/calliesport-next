"use client";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MagnifyingGlassIcon, DotsThreeOutlineVerticalIcon } from "@phosphor-icons/react";
import back_button from "../../../public/arrow_Left.svg";
import Link from "next/link";

export default function AppBarDetail() {
  return (
    <nav className="container sticky top-0 z-50 bg-white w-full border-b border-clx-border-default">
        <div className="flex items-center px-4 py-4">
          <div className="w-full bg-bg-dark">
              <div className="flex gap-4 content-center items-center">
                <Link href="/">
                  <Image src={back_button} width={24} height={24} alt="logo" />
                </Link>
                  <div>
                      <h3>Create tournament</h3>
                  </div>
              </div>
          </div>
          <div className="flex gap-2">
              <div>
                    <DotsThreeOutlineVerticalIcon size={20} weight="fill" className="text-clx-icon-default" />
              </div>
          </div>
        </div>
    </nav>
  );
}
