"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  useSensor,
  useSensors,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import Container from "@/components/container";
import zModes from "@/stores/modes";
import ModesHeader from "../components/modes-header";
import Placeholders from "./placeholders";
import Hearts from "../components/hearts";
import LivesLeftComp from "../components/lives-left";
import zTriviary2 from "../stores/triviary2";
import MyBadgeGroup from "../components/my-badge-group";
import { streakCounters, triviary2Legend } from "../lib/client-constants";
import PlaceholderCard from "../components/placeholder-card";
import { Item2 } from "../components/sortable-item2";
import { Button } from "../components/ui/button";

export default function TriviaryVer2() {
  const pathname = usePathname();
  const {
    containers,
    timeline,
    livesLeft,
    lives,
    played,
    won,
    resetPlay,
    getStreak,
    getBestStreak,
    setContainersDragEnd,
    setContainersDragOver,
    setContainersDragCancel,
  } = zTriviary2();
  const { getModeBySlug } = zModes();
  const mode = getModeBySlug(pathname);
  const gameOver = played && !won;
  const readySetGo = mode && timeline.length > 0;
  const [activeId, setActiveId] = useState(0); // id = igdbId in this context
  const mouseSensor = useSensor(MouseSensor);
  const touchSensor = useSensor(TouchSensor);
  const sensors = useSensors(mouseSensor, touchSensor);

  if (!readySetGo) {
    return <Placeholders />;
  }

  return (
    readySetGo && (
      <>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex flex-col min-h-screen">
            <ModesHeader mode={mode} />

            <div
              className={`flex flex-col p-4 mt-5 mb-5 justify-center bg-white shadow-sm relative ${
                process.env.NODE_ENV === "development" &&
                "border border-gray-200"
              }`}
            >
              <div className="flex justify-center mt-2">
                <div className="flex flex-row px-4 py-4 rounded-lg bg-white shadow-sm border-dashed border-2 border-sky-600">
                  <div className="relative w-full h-full">
                    <div className="relative">
                      <PlaceholderCard />
                    </div>
                    <div className="absolute inset-0 flex justify-center items-center">
                      <Container
                        id="nextGame"
                        items={containers.nextGame}
                        showTooltip={true}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`mt-5 mb-7 ${
                process.env.NODE_ENV === "development" &&
                "border border-gray-200"
              }`}
            >
              <div className="flex justify-center space-x-2">
                <Hearts lives={lives} livesLeft={livesLeft} size={"md"} />
              </div>
              <div className="flex justify-center space-x-2 mt-5">
                <LivesLeftComp
                  played={played}
                  won={won}
                  livesLeft={livesLeft}
                  lives={lives}
                />
              </div>
              <div className="flex justify-center space-x-2 mt-8 mb-4">
                {gameOver || won ? (
                  <MyBadgeGroup
                    group={streakCounters(getStreak(), getBestStreak())}
                  />
                ) : (
                  <MyBadgeGroup group={triviary2Legend} />
                )}
              </div>
              <div className="flex justify-center space-x-2">
                <Button
                  onClick={resetPlay}
                  className="bg-gradient-to-r from-gael-pink to-gael-purple via-gael-red hover:bg-gradient-to-r hover:from-gael-pink-dark hover:to-gael-purple-dark hover:via-gael-red-dark text-white text-md font-semibold tracking-sm"
                  disabled={!(gameOver || won)}
                >
                  Play again
                </Button>
              </div>
            </div>

            <div className="flex justify-left mt-5 rounded-lg bg-white shadow-sm border-dashed border-2 border-emerald-600 overflow-x-auto px-8 py-8">
              <div className="relative w-full h-full">
                <div className="absolute top-1/2 left-0 w-full border-t border-slate-800 transform -translate-y-1/2" />
                <div className="relative inset-0 flex justify-center items-center gap-4">
                  {activeId ? (
                    <Container
                      id="timeline"
                      items={containers.timeline}
                      showTooltip={false}
                    />
                  ) : (
                    containers.timeline.map((igdbId) => (
                      <Item2 key={igdbId} id={igdbId} showTooltip={false} />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <DragOverlay
            adjustScale
            dropAnimation={{
              duration: 500,
              easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
            }}
          >
            {activeId ? <Item2 id={activeId ?? 0} isDragging /> : null}
          </DragOverlay>
        </DndContext>
      </>
    )
  );

  function findContainer(id: string | number) {
    if (id in containers) {
      return id;
    }

    return Object.keys(containers).find((key) =>
      containers[key as keyof typeof containers].includes(id as number)
    );
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const { id } = active;
    setActiveId(id as number);
  }

  function handleDragOver(event: any) {
    // infinite loop fix?
    if (!event.over) {
      return;
    }

    const { active, over } = event;
    const { id: activeId } = active;
    const { id: overId } = over;
    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (
      !activeContainer ||
      !overContainer ||
      activeContainer === overContainer ||
      activeContainer === "timeline" // infinite loop fix?
    ) {
      return;
    }

    const draggingRect = active?.rect?.current?.translated;
    const overRect = over?.rect;
    setContainersDragOver({
      activeContainer,
      overContainer,
      activeId,
      overId,
      draggingRect,
      overRect,
      over,
      containers,
    });
  }

  function handleDragEnd(event: any) {
    const { active, over } = event;
    const { id: activeId } = active;
    const { id: overId } = over;
    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (
      !activeContainer ||
      !overContainer ||
      activeContainer !== overContainer ||
      (overContainer === "nextGame" && activeContainer === "nextGame")
    ) {
      handleDragCancel();

      return; // infinite loop fix?
    }

    const activeIndex = containers[
      activeContainer as keyof typeof containers
    ].indexOf(active.id);
    const overIndex =
      containers[overContainer as keyof typeof containers].indexOf(overId);
    setContainersDragEnd({
      overContainer,
      activeIndex,
      overIndex,
      arrayMove,
    });
    setActiveId(0);
  }

  function handleDragCancel(event?: any) {
    setContainersDragCancel();
    setActiveId(0);
  }
}
