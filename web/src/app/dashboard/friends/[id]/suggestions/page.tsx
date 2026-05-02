import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function FriendSuggestionsRedirectPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/dashboard/swipe?friend=${encodeURIComponent(id)}`);
}
