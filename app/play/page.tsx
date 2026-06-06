import { redirect } from "next/navigation";
import { GameClient } from "@/components/game/GameClient";

export default async function PlayPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session } = await searchParams;
  if (!session) redirect("/");
  return <GameClient sessionId={session} />;
}
