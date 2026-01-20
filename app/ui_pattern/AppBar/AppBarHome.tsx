import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MagnifyingGlassIcon, DotsThreeOutlineVerticalIcon, MoonIcon } from "@phosphor-icons/react";
import Brand_Logo from "../../../public/calliesport-logo.svg";

export default function AppBarHome() {
  return (
    <nav className="container w-full sticky top-0 z-50 bg-white">
        <div className="flex items-center px-4 pt-4 pb-2">
          <div className="w-full bg-bg-dark">
              <div className="flex gap-4">
                  <Image src={Brand_Logo} width={40} height={40} alt="logo" className="[&_path:first-child]:fill-[--color-orange-500]" />
                  <div className="space-y-0">
                      <div className="text-sm text-clx-text-placeholder">Padel</div>
                      <h1 className="font-weight-black">Calliesport</h1>
                  </div>
              </div>
          </div>
          <div className="flex gap-2 text-clx-icon-disabled">
              <div className="">
                    <MagnifyingGlassIcon size={24} />
              </div>
              <div className="">
                    <MoonIcon size={24} weight="regular" />
              </div>
          </div>
        </div>
        <div className="px-4 pt-3 pb-2">
            <Tabs defaultValue="account" className="w-auto">
                <TabsList className="bg-white gap-2">
                    <TabsTrigger className="data-[state=active]:bg-clx-bg-dark text-clx-text-white data-[state=inactive]:bg-clx-bg-neutral-bold data-[state=inactive]:text-clx-text-default px-4 py-1.5"  value="account">Tournaments</TabsTrigger>
                    <TabsTrigger className="data-[state=active]:bg-clx-bg-dark text-clx-text-white data-[state=inactive]:bg-clx-bg-neutral-bold data-[state=inactive]:text-clx-text-default px-4 py-1.5"  value="password">History</TabsTrigger>
                    <TabsTrigger className="data-[state=active]:bg-clx-bg-dark text-clx-text-white data-[state=inactive]:bg-clx-bg-neutral-bold data-[state=inactive]:text-clx-text-default px-4 py-1.5 invisible"  value="history">Rank</TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
    </nav>
  );
}
