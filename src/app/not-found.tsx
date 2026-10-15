import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="font-serif text-4xl text-primary">Page not found</h1>
      <Link href="/" className="mt-6 inline-block underline underline-offset-4">
        Return home
      </Link>
    </main>
  );
}
