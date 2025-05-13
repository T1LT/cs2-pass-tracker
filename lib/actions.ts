"use server";

import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function getSteamAccounts(side?: string) {
  try {
    const accounts = await prisma.steamAccount.findMany({
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

    const account = await prisma.steamAccount.create({
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
    await prisma.steamAccount.delete({
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
  starsEnd: number
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
    const steamAccount = await prisma.steamAccount.findFirst({
      where: {
        steamId,
      },
    });

    if (!steamAccount) {
      return { error: "Steam account not found" };
    }

    // Create the pass
    const pass = await prisma.pass.create({
      data: {
        name: `Pass for ${steamId}`,
        description: `Pass session for ${steamId}`,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        userId: session.user.id,
      },
    });

    // Create the pass session
    const passSession = await prisma.passSession.create({
      data: {
        passId: pass.id,
        steamAccountId: steamAccount.id,
        userId: session.user.id,
        starsStart,
        starsEnd,
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
