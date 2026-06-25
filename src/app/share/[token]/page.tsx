import ShareView from "@/components/Sharing/ShareView";

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <main style={{ minHeight: "100dvh", background: "var(--brand-bone)" }}>
      <ShareView token={token} />
    </main>
  );
}
