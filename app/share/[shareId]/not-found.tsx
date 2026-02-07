import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>
      <h1>Tournament not found</h1>
      <p>This share link may be invalid or the tournament no longer exists.</p>
      <Link href="/" style={{ color: "blue", textDecoration: "underline" }}>
        Go to Home
      </Link>
    </main>
  );
}
