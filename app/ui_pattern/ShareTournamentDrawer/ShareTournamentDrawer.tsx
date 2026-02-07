"use client";

import { useState, useEffect } from "react";
import { XIcon, CopyIcon, CheckIcon, SpinnerGapIcon, ShareNetworkIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Tournament, updateTournament } from "@/utils/tournament";
import { getShareUrl } from "@/utils/share";

interface ShareTournamentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament;
  onTournamentUpdate?: (tournament: Tournament) => void;
}

export default function ShareTournamentDrawer({
  isOpen,
  onClose,
  tournament,
  onTournamentUpdate,
}: ShareTournamentDrawerProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If tournament already has a shareId, show the existing URL
  useEffect(() => {
    if (isOpen && tournament.shareId) {
      setShareUrl(getShareUrl(tournament.shareId));
    }
  }, [isOpen, tournament.shareId]);

  const handleShare = async () => {
    setIsSharing(true);
    setError(null);

    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tournament),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create share link");
      }

      // Save shareId to tournament in localStorage (only on first share)
      if (!tournament.shareId) {
        const updatedTournament = { ...tournament, shareId: data.shareId };
        updateTournament(updatedTournament);
        onTournamentUpdate?.(updatedTournament);
      }

      const url = getShareUrl(data.shareId);
      setShareUrl(url);
      toast.success(tournament.shareId ? "Share link updated!" : "Share link created!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create share link";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      toast.success("Link copied to clipboard!");

      // Reset copy state after 2 seconds
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleClose = () => {
    // Reset state when closing (but keep shareUrl if tournament has shareId)
    if (!tournament.shareId) {
      setShareUrl(null);
    }
    setIsCopied(false);
    setError(null);
    onClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DrawerContent className="max-h-[85vh]" showHandle={true}>
        <DrawerHeader className="border-b border-clx-border-subtle px-4 pb-3 pt-0">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-base font-semibold text-clx-text-default">
              Share Tournament
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" aria-label="Close">
                <XIcon size={24} />
              </Button>
            </DrawerClose>
          </div>
          <DrawerDescription className="sr-only">
            Generate a shareable link for this tournament
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 p-4 space-y-4">
          {!shareUrl ? (
            // Initial state - show share button
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-clx-bg-primary-surface flex items-center justify-center">
                <ShareNetworkIcon size={32} className="text-clx-icon-primary" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-base font-semibold text-clx-text-default">
                  Share &quot;{tournament.name}&quot;
                </h3>
                <p className="text-sm text-clx-text-secondary max-w-[280px]">
                  Generate a public link that anyone can use to view the tournament leaderboard and match results.
                </p>
              </div>

              {error && (
                <p className="text-sm text-clx-text-danger text-center">{error}</p>
              )}

              <Button
                onClick={handleShare}
                disabled={isSharing}
                className="w-full max-w-[280px] h-11"
              >
                {isSharing ? (
                  <>
                    <SpinnerGapIcon size={20} className="animate-spin mr-2" />
                    Creating link...
                  </>
                ) : (
                  "Generate Share Link"
                )}
              </Button>
            </div>
          ) : (
            // Success state - show share URL
            <div className="space-y-4">
              <div className="flex flex-col items-center py-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckIcon size={24} className="text-green-600" />
                </div>
                <p className="text-sm text-clx-text-secondary text-center">
                  Your share link is ready! Anyone with this link can view the tournament.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-clx-text-default">
                  Share link
                </label>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="flex-1 text-sm bg-clx-bg-neutral-subtle"
                  />
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    className="shrink-0 h-10 px-3"
                  >
                    {isCopied ? (
                      <CheckIcon size={20} className="text-clx-icon-success" />
                    ) : (
                      <CopyIcon size={20} />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleShare}
                disabled={isSharing}
                variant="outline"
                className="w-full"
              >
                {isSharing ? (
                  <>
                    <SpinnerGapIcon size={20} className="animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  "Update Share Link"
                )}
              </Button>
            </div>
          )}
        </div>

        <DrawerFooter className="border-t border-clx-border-subtle">
          {shareUrl ? (
            <Button onClick={handleCopy} className="w-full h-11">
              {isCopied ? "Copied!" : "Copy Link"}
            </Button>
          ) : null}
          <DrawerClose asChild>
            <Button variant="ghost" className="w-full">
              {shareUrl ? "Done" : "Cancel"}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
