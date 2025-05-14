import { getSteamAccounts } from "@/lib/actions";
import { CTSideClient } from "./ct-side-client";

export default async function CTSide() {
  const result = await getSteamAccounts("CT");
  const accounts = result.data || [];

  return <CTSideClient initialAccounts={accounts} />;
}
