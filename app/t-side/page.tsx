import { getSteamAccounts } from "@/lib/actions";
import { TSideClient } from "./t-side-client";

export default async function TSide() {
  const result = await getSteamAccounts("T");
  const accounts = result.data || [];

  return <TSideClient initialAccounts={accounts} />;
}
