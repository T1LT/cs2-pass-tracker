"use client";

import { useState, useEffect } from "react";
import { createPassSession, getLastSessionStars } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SteamAccount {
  id: string;
  steamId: string;
  side: string;
}

interface PassSession {
  starsStart: number;
  starsEnd?: number;
  purchasedPass: boolean;
}

interface TSideClientProps {
  initialAccounts: SteamAccount[];
}

export function TSideClient({ initialAccounts }: TSideClientProps) {
  const [passSessions, setPassSessions] = useState<Record<string, PassSession>>(
    {}
  );
  const [lastSessionStars, setLastSessionStars] = useState<
    Record<string, number>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    // Fetch last session stars for each account
    const fetchLastSessionStars = async () => {
      const stars: Record<string, number> = {};
      const initialSessions: Record<string, PassSession> = {};

      for (const account of initialAccounts) {
        const result = await getLastSessionStars(account.steamId);
        if (result.data !== undefined) {
          stars[account.steamId] = result.data;
          // Initialize the passSessions state with the last session stars
          initialSessions[account.steamId] = {
            starsStart: result.data,
            purchasedPass: false,
          };
        }
      }
      setLastSessionStars(stars);
      setPassSessions(initialSessions);
    };

    fetchLastSessionStars();
  }, [initialAccounts]);

  const handlePassSessionSubmit = async () => {
    try {
      setIsLoading(true);
      const sessions = Object.entries(passSessions);
      if (sessions.length === 0) return;

      const startDate = new Date().toISOString();
      const endDate = new Date(
        Date.now() + 8 * 24 * 60 * 60 * 1000
      ).toISOString();

      // Create all sessions in parallel
      const results = await Promise.all(
        sessions.map(([steamId, session]) =>
          createPassSession(
            steamId,
            startDate,
            endDate,
            session.starsStart,
            session.starsEnd ?? 0,
            session.purchasedPass
          )
        )
      );

      // If all sessions were created successfully, update lastSessionStars and clear the form
      if (results.every((result) => result.data)) {
        // Update lastSessionStars with the final starsEnd values
        const updatedStars = { ...lastSessionStars };
        sessions.forEach(([steamId, session]) => {
          if (session.starsEnd !== undefined) {
            updatedStars[steamId] = session.starsEnd;
          }
        });
        setLastSessionStars(updatedStars);

        // Reinitialize passSessions with the updated lastSessionStars
        const newPassSessions: Record<string, PassSession> = {};
        initialAccounts.forEach((account) => {
          if (updatedStars[account.steamId] !== undefined) {
            newPassSessions[account.steamId] = {
              starsStart: updatedStars[account.steamId],
              purchasedPass: false,
            };
          }
        });
        setPassSessions(newPassSessions);

        // Sign out after successful submission
        await signOut();
      }
    } catch (error) {
      console.error("Error creating pass sessions:", error);
    } finally {
      setIsLoading(false);
      setShowConfirmDialog(false);
    }
  };

  const pendingSessions = Object.entries(passSessions);
  const validSessions = pendingSessions.filter(
    ([_, session]) =>
      typeof session.starsStart === "number" &&
      !isNaN(session.starsStart) &&
      session.starsStart >= 0 &&
      session.starsStart <= 40 &&
      typeof session.starsEnd === "number" &&
      !isNaN(session.starsEnd) &&
      session.starsEnd >= 0 &&
      session.starsEnd <= 40
  );

  const totalStarsEarned =
    validSessions.length > 0
      ? Math.min(
          ...validSessions.map(([_, session]) => {
            if (!session.starsEnd) return 0;
            if (session.purchasedPass) {
              return session.starsEnd === session.starsStart
                ? 40
                : 40 + (session.starsEnd - session.starsStart);
            }
            return session.starsEnd - session.starsStart;
          })
        )
      : "-";

  return (
    <div className="h-full p-8 pt-24 flex flex-col items-center">
      <div className="mb-8 flex justify-center items-center gap-4">
        <Link href="/">
          <ArrowLeft className="h-7 w-7 shrink-0" strokeWidth={4} />
        </Link>
        <Image src="/t-logo.webp" alt="T Logo" width={40} height={40} />
        <h1 className="text-4xl font-bold text-center text-orange-300">
          T Side Accounts
        </h1>
      </div>

      <div className="w-full max-w-4xl flex gap-8">
        <div className="flex-1">
          <div className="flex flex-col items-center gap-4">
            {initialAccounts.map((account) => (
              <div
                key={account.id}
                className="w-full px-6 pt-4 pb-6 border rounded-lg space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-xl text-orange-300">
                    {account.steamId}
                  </span>
                </div>
                <div className="flex gap-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor={`stars-start-${account.id}`}
                      className="text-sm flex items-center gap-1"
                    >
                      <Star className="h-4 w-4 shrink-0 text-green-500 fill-green-500" />
                      Stars Start
                    </Label>
                    <Input
                      id={`stars-start-${account.id}`}
                      type="number"
                      value={
                        passSessions[account.steamId]?.starsStart ??
                        lastSessionStars[account.steamId] ??
                        ""
                      }
                      onChange={(e) => {
                        // Only allow changes if there's no last session
                        if (lastSessionStars[account.steamId] === undefined) {
                          setPassSessions((prev) => ({
                            ...prev,
                            [account.steamId]: {
                              ...prev[account.steamId],
                              starsStart:
                                e.target.value === ""
                                  ? 0
                                  : parseInt(e.target.value),
                            },
                          }));
                        }
                      }}
                      min={0}
                      max={40}
                      className="w-24"
                      disabled={lastSessionStars[account.steamId] !== undefined}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor={`stars-end-${account.id}`}
                      className="text-sm flex items-center gap-1"
                    >
                      <Star className="h-4 w-4 shrink-0 text-green-500 fill-green-500" />
                      Stars End
                    </Label>
                    <Input
                      id={`stars-end-${account.id}`}
                      type="number"
                      value={passSessions[account.steamId]?.starsEnd ?? ""}
                      onChange={(e) =>
                        setPassSessions((prev) => ({
                          ...prev,
                          [account.steamId]: {
                            ...prev[account.steamId],
                            starsEnd:
                              e.target.value === ""
                                ? 0
                                : parseInt(e.target.value),
                          },
                        }))
                      }
                      min={0}
                      max={40}
                      className="w-24"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor={`purchased-pass-${account.id}`}
                      className="text-sm flex items-center gap-1"
                    >
                      Purchased Pass?
                    </Label>
                    <div className="h-9 flex items-center">
                      <input
                        id={`purchased-pass-${account.id}`}
                        type="checkbox"
                        checked={
                          passSessions[account.steamId]?.purchasedPass || false
                        }
                        onChange={(e) =>
                          setPassSessions((prev) => ({
                            ...prev,
                            [account.steamId]: {
                              ...prev[account.steamId],
                              purchasedPass: e.target.checked,
                            },
                          }))
                        }
                        className="h-4 w-4"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Card */}
        <div className="w-96">
          <div className="sticky top-8">
            <div className="border rounded-lg p-6 space-y-4">
              <h2 className="text-2xl font-bold text-orange-300">
                Session Summary
              </h2>
              {pendingSessions.length === 0 ? (
                <p className="text-gray-500">No sessions added yet</p>
              ) : (
                <>
                  <div className="space-y-3">
                    {pendingSessions.map(([steamId, session]) => {
                      const hasValidInputs =
                        typeof session.starsStart === "number" &&
                        !isNaN(session.starsStart) &&
                        session.starsStart >= 0 &&
                        session.starsStart <= 40 &&
                        typeof session.starsEnd === "number" &&
                        !isNaN(session.starsEnd) &&
                        session.starsEnd >= 0 &&
                        session.starsEnd <= 40;

                      const isValidStars =
                        session.purchasedPass ||
                        (typeof session.starsEnd === "number" &&
                          session.starsEnd > session.starsStart);

                      return (
                        <div key={steamId} className="pb-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{steamId}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setPassSessions((prev) => {
                                  const newSessions = { ...prev };
                                  delete newSessions[steamId];
                                  return newSessions;
                                })
                              }
                              className="text-red-500 hover:text-red-600"
                            >
                              Remove
                            </Button>
                          </div>
                          <div className="text-sm text-gray-500">
                            Stars: {session.starsStart ?? "-"} →{" "}
                            {session.starsEnd ?? "-"}
                            {session.purchasedPass && (
                              <span className="ml-2 text-xs text-orange-300">
                                (New Pass)
                              </span>
                            )}
                          </div>
                          {hasValidInputs &&
                            isValidStars &&
                            session.starsEnd !== undefined && (
                              <div className="text-sm font-medium text-green-500">
                                Earned:{" "}
                                {session.purchasedPass
                                  ? session.starsEnd === session.starsStart
                                    ? 40
                                    : 40 +
                                      (session.starsEnd - session.starsStart)
                                  : session.starsEnd - session.starsStart}{" "}
                                stars
                              </div>
                            )}
                          {hasValidInputs && !isValidStars && (
                            <div className="text-sm font-medium text-red-500">
                              End stars must be greater than start stars
                            </div>
                          )}
                          {!hasValidInputs && (
                            <div className="text-sm font-medium text-red-500">
                              Stars must be between 0 and 40
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {validSessions.length > 0 && (
                    <div className="pt-4 border-t">
                      <div className="text-lg font-semibold text-orange-300">
                        Total Stars Earned: {totalStarsEarned}
                      </div>
                    </div>
                  )}
                  <div className="pt-4">
                    <Button
                      className="w-full"
                      onClick={() => setShowConfirmDialog(true)}
                      disabled={
                        isLoading ||
                        pendingSessions.length === 0 ||
                        !pendingSessions.every(
                          ([_, session]) =>
                            typeof session.starsStart === "number" &&
                            !isNaN(session.starsStart) &&
                            session.starsStart >= 0 &&
                            session.starsStart <= 40 &&
                            typeof session.starsEnd === "number" &&
                            !isNaN(session.starsEnd) &&
                            session.starsEnd >= 0 &&
                            session.starsEnd <= 40 &&
                            (session.purchasedPass ||
                              session.starsEnd > session.starsStart)
                        )
                      }
                    >
                      {isLoading ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Submitting...
                        </>
                      ) : (
                        "Submit All Sessions"
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
            <AlertDialogDescription>
              Please review the following session details before submitting:
              <div className="mt-4 space-y-2">
                {pendingSessions.map(([steamId, session]) => (
                  <div key={steamId} className="text-sm">
                    <div className="font-medium">{steamId}</div>
                    <div className="text-muted-foreground">
                      Stars: {session.starsStart} → {session.starsEnd}
                      {session.purchasedPass && (
                        <span className="ml-2 text-xs text-orange-300">
                          (New Pass)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 font-medium">
                Total Stars Earned: {totalStarsEarned}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePassSessionSubmit}>
              Confirm & Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
