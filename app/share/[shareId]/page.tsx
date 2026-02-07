import SharePageClient from "./SharePageClient";

interface PageProps {
  params: Promise<{ shareId: string }>;
}

export default async function SharedTournamentPage({ params }: PageProps) {
  const { shareId } = await params;
  return <SharePageClient shareId={shareId} />;
}
