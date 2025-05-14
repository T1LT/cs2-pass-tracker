import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center">
        <h1 className="text-4xl font-bold tracking-tight">CS2 Pass Tracker</h1>
        <div className="flex flex-col sm:flex-row gap-16 items-center">
          <div className="flex flex-col items-center gap-4">
            <Link
              href="/ct-side"
              className="transition-transform hover:scale-105"
            >
              <Image
                src="/ct-logo.webp"
                alt="CT Side Logo"
                width={200}
                height={200}
                priority
                className="rounded-lg shadow-lg"
                unoptimized
              />
            </Link>
            <span className="text-2xl font-bold tracking-tight text-indigo-400">
              CT Side
            </span>
          </div>
          <div className="flex flex-col items-center gap-4">
            <Link
              href="/t-side"
              className="transition-transform hover:scale-105"
            >
              <Image
                src="/t-logo.webp"
                alt="T Side Logo"
                width={200}
                height={200}
                priority
                className="rounded-lg shadow-lg"
                unoptimized
              />
            </Link>
            <span className="text-2xl font-bold tracking-tight text-orange-300">
              T Side
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
