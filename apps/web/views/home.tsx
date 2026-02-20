import { GameModeCard } from "@/components/game-mode-card";
import { gameModes } from "@/lib/game-mode";
import { appInfo } from "@/lib/app-info";
import Link from "next/link";

export default function HomeView() {
  return (
    <div className="bg-background text-foreground">
      <div className="relative overflow-hidden">
        {/* Glow effect */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-180 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.8)_0%,rgba(255,255,255,0)_70%)] opacity-70" />

        <div className="container mx-auto px-4 py-12 relative z-10">
          <header className="mx-auto max-w-2xl text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{appInfo.title}</h1>
            <p className="mt-3 text-lg text-muted-foreground">{appInfo.description}</p>
          </header>

          <section className="pb-8">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {gameModes.map((gameMode) => (
                <GameModeCard
                  key={gameMode.id}
                  href={gameMode.href}
                  title={gameMode.title}
                  description={gameMode.description}
                  difficulty={gameMode.difficulty}
                  icon={gameMode.icon}
                  gradient={gameMode.gradient}
                />
              ))}
            </div>
          </section>

          <p className="text-md text-center">
            Inspired by&nbsp;
            <Link href="https://gamedle.wtf" target="_blank" className="underline hover:text-sky-600">
              Gamedle
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
