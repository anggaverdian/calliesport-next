"use client";

import { useState, useEffect, useRef } from "react";
import { CopyIcon, CheckIcon, SpinnerGapIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const hasTriggeredShare = useRef(false);

  // Auto-trigger share when dialog opens
  useEffect(() => {
    if (isOpen && !hasTriggeredShare.current) {
      hasTriggeredShare.current = true;

      if (tournament.shareId) {
        // Already shared — show URL immediately and update data in background
        setShareUrl(getShareUrl(tournament.shareId));
        handleShareUpdate();
      } else {
        // First time sharing — auto-generate link
        handleShare();
      }
    }

    if (!isOpen) {
      hasTriggeredShare.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleShareUpdate = async () => {
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
        throw new Error(data.error || "Failed to update share link");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update share link";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSharing(false);
    }
  };

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

      // Save shareId to tournament in localStorage
      const updatedTournament = { ...tournament, shareId: data.shareId };
      updateTournament(updatedTournament);
      onTournamentUpdate?.(updatedTournament);

      const url = getShareUrl(data.shareId);
      setShareUrl(url);
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

      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleOpenLink = async () => {
    if (!shareUrl) return;

    // In iOS standalone PWA, same-origin window.open stays inside the PWA.
    // Use the Web Share API (native share sheet) when in standalone mode,
    // which lets the user open the link in their default browser.
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone);

    if (isStandalone && navigator.share) {
      try {
        await navigator.share({
          title: tournament.name,
          url: shareUrl,
        });
      } catch {
        // User cancelled share sheet — ignore
      }
    } else {
      window.open(shareUrl, "_blank");
    }
  };

  const handleClose = () => {
    if (!tournament.shareId) {
      setShareUrl(null);
    }
    setIsCopied(false);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="px-0 py-3" showCloseButton={false} onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader className="px-4 pb-2 bg-neutral-50 text-left sm:text-left border-b">
          <DialogTitle className="font-semibold text-base">
            Share tournament
          </DialogTitle>
          <DialogDescription className="sr-only">
            Share a link to this tournament
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 flex flex-col gap-3 items-center">
          <Image
            src="/cloud.svg"
            alt="Cloud"
            width={96}
            height={48}
          />

          {isSharing && !shareUrl ? (
            <div className="flex items-center gap-2 text-sm text-clx-text-secondary">
              <SpinnerGapIcon size={20} className="animate-spin" />
              <span>Generating link...</span>
            </div>
          ) : error && !shareUrl ? (
            <div className="w-full space-y-3">
              <p className="text-sm text-clx-text-danger text-center">{error}</p>
              <Button
                onClick={handleShare}
                className="w-full h-11 bg-clx-bg-accent"
              >
                Try again
              </Button>
            </div>
          ) : shareUrl ? (
            <>
              <div className="w-full space-y-1">
                <label className="text-base font-semibold text-clx-text-default">
                  Get link
                </label>
                <div className="flex gap-3 items-end">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="flex-1 h-11 text-base bg-clx-bg-neutral-bold border-clx-bg-neutral-bold text-clx-bg-accent"
                  />
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    className="shrink-0 size-11 p-0 rounded-lg border-clx-border-textfield"
                  >
                    {isCopied ? (
                      <CheckIcon size={20} className="text-clx-icon-success" />
                    ) : (
                      <CopyIcon size={20} />
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-sm text-clx-text-secondary w-full">
                Share the link to your player. Anyone with this link can view and follow leaderboard or when to play from their own phone.
              </p>
            </>
          ) : null}
        </div>

        <DialogFooter className="flex flex-row items-center justify-end px-4 mt-1 gap-2 sm:gap-2 border-t pt-3">
          <DialogClose asChild>
            <Button variant="ghost" className="text-clx-text-secondary">
              Close
            </Button>
          </DialogClose>
          {shareUrl && (
            <Button
              onClick={handleOpenLink}
              size="lg"
              className="bg-clx-bg-accent font-semibold"
            >
              Share
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
