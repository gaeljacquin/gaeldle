"use client";

import GameModeCard from "@/components/game-mode-card";
import { GameModes } from "@/lib/game-mode";
import { appInfo } from "@/lib/app-info";

export default function Home() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">{appInfo.title}</h1>
            <p className="text-lg text-muted-foreground">{appInfo.description}</p>
          </div>
          <div className="flex flex-wrap items-stretch justify-start gap-4 md:gap-6">
            {GameModes.map((gameMode) => (
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
        </div>
      </div>
    </div>
  );
}
