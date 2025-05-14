"use client";

import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { format } from "date-fns";
import { getSessions } from "@/lib/actions";

interface SessionResult {
  date: string;
  count: number;
  users: {
    id: string;
    name: string | null;
    sessionCount: number;
    totalStarsEarned: number;
    sessions: {
      starsStart: number;
      starsEnd: number;
      starsEarned: number;
      createdAt: Date;
      purchasedPass: boolean;
    }[];
  }[];
}

export default function AdminDashboard() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDateSelect = async (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    setError(null);

    if (selectedDate) {
      setIsLoading(true);
      try {
        const results = await getSessions(format(selectedDate, "yyyy-MM-dd"));
        setSessionResults(results);
      } catch (error) {
        console.error("Error fetching sessions:", error);
        setError(
          error instanceof Error ? error.message : "Failed to fetch sessions"
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="container mx-auto p-6 pt-24">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Session Results -{" "}
              {date ? format(date, "MMMM d, yyyy") : "Select a date"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-red-500">{error}</div>
            ) : isLoading ? (
              <div>Loading...</div>
            ) : sessionResults && sessionResults.length > 0 ? (
              <div className="space-y-6">
                <div className="text-lg font-semibold">
                  Total Sessions: {sessionResults[0].count}
                </div>
                <div className="space-y-4">
                  <h3 className="font-medium">Users:</h3>
                  {sessionResults[0].users.map((user) => (
                    <div
                      key={user.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">
                          {user.name || "Unknown"}
                        </span>
                        <div className="text-sm text-muted-foreground space-x-4">
                          <span>{user.sessionCount} sessions</span>
                          <span>{user.totalStarsEarned} stars earned</span>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div className="font-medium mb-1">Session Details:</div>
                        <ul className="space-y-1">
                          {user.sessions.map((session, index) => (
                            <li
                              key={index}
                              className="flex justify-between items-center"
                            >
                              <span>{format(session.createdAt, "HH:mm")}</span>
                              <div className="flex items-center gap-2">
                                <span>
                                  {session.starsStart} → {session.starsEnd} (
                                  {session.starsEarned} stars earned)
                                </span>
                                {session.purchasedPass && (
                                  <span className="text-green-500 text-xs">
                                    Purchased Pass
                                  </span>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>No sessions found for this date</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
