import Image from "next/image";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge"
import { MagnifyingGlassIcon, MoonIcon } from "@phosphor-icons/react";
import Brand_Logo from "../../../public/calliesport-logo.svg";

export type HomeTab = "tournaments" | "history";

interface AppBarHomeProps {
  activeTab?: HomeTab;
  onTabChange?: (tab: HomeTab) => void;
}

export default function AppBarHome({ activeTab = "tournaments", onTabChange }: AppBarHomeProps) {
  return (
    <nav className="container w-full sticky top-0 z-50 bg-white pt-[env(safe-area-inset-top)]">
        <div className="flex items-center px-4 pt-4 pb-2">
          <div className="w-full bg-bg-dark">
              <div className="flex gap-4">
                  <Image src={Brand_Logo} width={40} height={40} alt="logo" className="[&_path:first-child]:fill-[--color-orange-500]" />
                  <div className="space-y-0">
                      <div className="text-sm text-clx-text-placeholder">Padel</div>
                      <div className="flex gap-2 items-center"><h1 className="font-weight-black">Calliesport</h1><Badge className="text-xs h-5 bg-clx-bg-accent">Beta</Badge></div>
                  </div>
              </div>
          </div>
          <div className="flex gap-2 text-clx-icon-disabled hidden">
              <div className="">
                    <MagnifyingGlassIcon size={24} />
              </div>
              <div className="">
                    <MoonIcon size={24} weight="regular" />
              </div>
          </div>
        </div>
        <div className="px-4 pt-3 pb-2">
            <Tabs value={activeTab} onValueChange={(value) => onTabChange?.(value as HomeTab)} className="w-auto">
                <TabsList className="bg-white gap-2">
                    <TabsTrigger className="data-[state=active]:bg-clx-bg-dark text-clx-text-white data-[state=inactive]:bg-clx-bg-neutral-bold data-[state=inactive]:text-clx-text-default px-4 py-1.5" value="tournaments">Tournaments</TabsTrigger>
                    <TabsTrigger className="data-[state=active]:bg-clx-bg-dark text-clx-text-white data-[state=inactive]:bg-clx-bg-neutral-bold data-[state=inactive]:text-clx-text-default px-4 py-1.5" value="history">History</TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
    </nav>
  );
}
