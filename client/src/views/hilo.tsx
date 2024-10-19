"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Container from "@/components/container";
import zModes from "@/stores/modes";
import ModesHeader from "../components/modes-header";
import Placeholders from "./placeholders";
import Hearts from "../components/hearts";
import LivesLeftComp from "../components/lives-left";
import zHilo from "../stores/hilo";
import MyBadgeGroup from "../components/my-badge-group";
import {
  streakCounters,
  timeline2Legend as hiloLegend,
} from "../lib/client-constants";
import PlaceholderCard from "../components/placeholder-card";
import { Item2 } from "../components/sortable-item2";
import { Button } from "../components/ui/button";

export default function Hilo() {
  const pathname = usePathname();
  const { livesLeft, lives, played, won } = zHilo();
  const { getModeBySlug } = zModes();
  const mode = getModeBySlug(pathname);
  const gameOver = played && !won;
  const readySetGo = mode;

  if (!readySetGo) {
    return <Placeholders />;
  }

  return readySetGo && <></>;
}
