"use client";

import { useState, useEffect } from "react";
import { getSteamAccounts, createPassSession } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SteamAccount {
  id: string;
  steamId: string;
  side: string;
}

interface PassSession {
  starsStart: number;
  starsEnd: number;
}

export default function TSide() {
  const [accounts, setAccounts] = useState<SteamAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [passSessions, setPassSessions] = useState<Record<string, PassSession>>(
    {}
  );

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const result = await getSteamAccounts("T");
      if (result.data) {
        setAccounts(result.data);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePassSessionSubmit = async (steamId: string) => {
    try {
      const session = passSessions[steamId];
      if (!session) return;

      const startDate = new Date().toISOString();
      const endDate = new Date(
        Date.now() + 8 * 24 * 60 * 60 * 1000
      ).toISOString();

      const result = await createPassSession(
        steamId,
        startDate,
        endDate,
        session.starsStart,
        session.starsEnd
      );

      if (result.data) {
        // Clear the form for this steam account
        setPassSessions((prev) => {
          const newSessions = { ...prev };
          delete newSessions[steamId];
          return newSessions;
        });
      }
    } catch (error) {
      console.error("Error creating pass session:", error);
    }
  };

  return (
    <div className="min-h-screen p-8 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold mb-8 text-center">
          T Side Steam Accounts
        </h1>

        {loading ? (
          <p className="text-center">Loading accounts...</p>
        ) : (
          <div className="grid gap-4">
            {accounts.map((account) => (
              <div key={account.id} className="p-3 border rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-base">{account.steamId}</span>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handlePassSessionSubmit(account.steamId);
                  }}
                  className="flex gap-3 items-end"
                >
                  <div className="flex-1 space-y-2">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor={`stars-start-${account.id}`}
                        className="text-sm"
                      >
                        Stars Start
                      </Label>
                      <Input
                        id={`stars-start-${account.id}`}
                        type="number"
                        value={passSessions[account.steamId]?.starsStart || ""}
                        onChange={(e) =>
                          setPassSessions((prev) => ({
                            ...prev,
                            [account.steamId]: {
                              ...prev[account.steamId],
                              starsStart: parseInt(e.target.value),
                            },
                          }))
                        }
                        required
                        min={0}
                        max={40}
                        className="w-24"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor={`stars-end-${account.id}`}
                        className="text-sm"
                      >
                        Stars End
                      </Label>
                      <Input
                        id={`stars-end-${account.id}`}
                        type="number"
                        value={passSessions[account.steamId]?.starsEnd || ""}
                        onChange={(e) =>
                          setPassSessions((prev) => ({
                            ...prev,
                            [account.steamId]: {
                              ...prev[account.steamId],
                              starsEnd: parseInt(e.target.value),
                            },
                          }))
                        }
                        required
                        min={0}
                        max={40}
                        className="w-24"
                      />
                    </div>
                  </div>
                  <Button type="submit" size="sm">
                    Create Session
                  </Button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
