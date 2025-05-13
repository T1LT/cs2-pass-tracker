import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create CT side accounts
  const ctAccounts = [
    { steamId: "ponce", side: "CT" },
    { steamId: "nashax", side: "CT" },
    { steamId: "niyah", side: "CT" },
  ];

  // Create T side accounts
  const tAccounts = [
    { steamId: "money tree", side: "T" },
    { steamId: "intelek", side: "T" },
  ];

  // Create all accounts
  for (const account of [...ctAccounts, ...tAccounts]) {
    await prisma.steamAccount.upsert({
      where: { steamId: account.steamId },
      update: {},
      create: {
        steamId: account.steamId,
        side: account.side,
      },
    });
  }

  console.log("Successfully seeded steam accounts");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
