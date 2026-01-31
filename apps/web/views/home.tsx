"use client";

import GameModeCard from "@/components/game-mode-card";
import { gameModes } from "@/lib/game-mode";
import { appInfo } from "@/lib/app-info";

export default function Home() {
  return (
    <div className="redesign min-h-full bg-background text-foreground">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-180 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.8)_0%,rgba(255,255,255,0)_70%)] opacity-70" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.4)_0%,rgba(255,255,255,0)_45%)]" />
        <div className="container mx-auto px-4 py-12">
          <header className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{appInfo.title}</h1>
            <p className="mt-3 text-lg text-muted-foreground">{appInfo.description}</p>
          </header>

          <section className="mt-12 pb-8">
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
                  pattern={gameMode.pattern}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
