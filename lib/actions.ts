"use server";

import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import { UserType } from "@prisma/client";

const prismaClient = new PrismaClient();

export async function getSteamAccounts(side?: string) {
  try {
    const accounts = await prismaClient.steamAccount.findMany({
      where: {
        side: side || undefined,
      },
    });
    return { data: accounts };
  } catch (error) {
    console.error("Error fetching steam accounts:", error);
    return { error: "Failed to fetch steam accounts" };
  }
}

export async function createSteamAccount(steamId: string, side: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    if (!steamId || !side) {
      return { error: "Steam ID and side are required" };
    }

    const account = await prismaClient.steamAccount.create({
      data: {
        steamId,
        side,
      },
    });

    return { data: account };
  } catch (error) {
    console.error("Error creating steam account:", error);
    return { error: "Failed to create steam account" };
  }
}

export async function deleteSteamAccount(id: string) {
  try {
    await prismaClient.steamAccount.delete({
      where: {
        id,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting steam account:", error);
    return { error: "Failed to delete steam account" };
  }
}

export async function createPassSession(
  steamId: string,
  startDate: string,
  endDate: string,
  starsStart: number,
  starsEnd: number,
  purchasedPass: boolean = false
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    if (!steamId || !startDate || !endDate) {
      return { error: "Steam ID, start date, and end date are required" };
    }

    // Find the steam account
    const steamAccount = await prismaClient.steamAccount.findFirst({
      where: {
        steamId,
      },
    });

    if (!steamAccount) {
      return { error: "Steam account not found" };
    }

    // Calculate stars earned
    const starsEarned = purchasedPass ? 40 : starsEnd - starsStart;

    // Create the pass
    const pass = await prismaClient.pass.create({
      data: {
        name: `Pass for ${steamId}`,
        description: `Pass session for ${steamId}`,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        userId: session.user.id,
        currentStars: starsStart,
        totalStars: purchasedPass ? starsStart + 40 : starsEnd,
      },
    });

    // Create the pass session
    const passSession = await prismaClient.passSession.create({
      data: {
        passId: pass.id,
        steamAccountId: steamAccount.id,
        userId: session.user.id,
        starsStart,
        starsEnd: purchasedPass ? starsStart + 40 : starsEnd,
        starsEarned,
        purchasedPass,
        startDate: new Date(startDate),
        completeDate: new Date(endDate),
      },
    });

    return { data: passSession };
  } catch (error) {
    console.error("Error creating pass session:", error);
    return { error: "Failed to create pass session" };
  }
}

export async function getLastSessionStars(steamId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // Find the steam account
    const steamAccount = await prismaClient.steamAccount.findFirst({
      where: {
        steamId,
      },
      include: {
        sessions: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            starsEnd: true,
          },
        },
      },
    });

    if (!steamAccount) {
      return { error: "Steam account not found" };
    }

    return { data: steamAccount.sessions[0]?.starsEnd ?? 0 };
  } catch (error) {
    console.error("Error fetching last session stars:", error);
    return { error: "Failed to fetch last session stars" };
  }
}

interface SessionUser {
  id: string;
  name: string | null;
  userType: UserType;
}

export async function getSessions(date: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error("Unauthorized - Not logged in");
  }

  // Get the full user data from the database to check userType
  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      userType: true,
    },
  });

  if (!user || user.userType !== "ADMIN") {
    throw new Error("Unauthorized - Not an admin");
  }

  try {
    const startDate = startOfDay(new Date(date));
    const endDate = endOfDay(new Date(date));

    const sessions = await prisma.passSession.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Group sessions by user
    const userSessions = sessions.reduce<
      Record<
        string,
        {
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
        }
      >
    >((acc, session) => {
      const userId = session.user.id;
      if (!acc[userId]) {
        acc[userId] = {
          id: userId,
          name: session.user.name || "Unknown",
          sessionCount: 0,
          totalStarsEarned: 0,
          sessions: [],
        };
      }
      acc[userId].sessionCount++;
      acc[userId].totalStarsEarned += session.starsEarned;

      acc[userId].sessions.push({
        starsStart: session.starsStart,
        starsEnd: session.starsEnd,
        starsEarned: session.starsEarned,
        createdAt: session.createdAt,
        purchasedPass: session.purchasedPass,
      });
      return acc;
    }, {});

    return [
      {
        date,
        count: sessions.length,
        users: Object.values(userSessions),
      },
    ];
  } catch (error) {
    console.error("Error fetching sessions:", error);
    throw new Error("Failed to fetch sessions");
  }
}
