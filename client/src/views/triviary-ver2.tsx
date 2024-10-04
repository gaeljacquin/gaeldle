"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import Container from "@/components/container";
import { SortableItem } from "@/components/sortable-item";
import zModes from "@/stores/modes";
import ModesHeader from "../components/modes-header";
import Placeholders from "./placeholders";
import Hearts from "../components/hearts";
import LivesLeftComp from "../components/lives-left";
import zTriviaryVer2 from "../stores/triviary-ver2";
import GameCard from "../components/game-card";
import MyBadgeGroup from "../components/my-badge-group";
import { triviaryVer2Legend } from "../lib/client-constants";
import { findCard } from "../lib/utils";

export default function TriviaryVer2() {
  const pathname = usePathname();
  const {
    timeline,
    livesLeft,
    lives,
    played,
    won,
    submitButtonText,
    dummyOnLoad,
    nextGame,
    updateTimeline,
    submitAnswer,
    resetPlay,
    getStreak,
    getMaxStreak,
  } = zTriviaryVer2();
  const { getModeBySlug } = zModes();
  const mode = getModeBySlug(pathname);
  const readySetGo = mode && timeline && nextGame;

  const [items, setItems] = useState({
    nextGameContainer: [nextGame],
    timelineContainer: timeline,
  });
  const [activeItem, setActiveItem] = useState();
  const daList = [...timeline, nextGame];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
        >
          <div className="flex flex-col min-h-screen">
            <ModesHeader mode={mode} />

            <div
              className={`flex flex-col p-4 mt-5 mb-5 justify-center bg-white shadow-sm ${
                process.env.NODE_ENV === "development" &&
                "border border-gray-200"
              }`}
            >
              <div className="flex justify-center mt-2">
                <div className="flex flex-row px-4 py-4 rounded-lg bg-white shadow-sm border-dashed border-2 border-gray-600 overflow-x-auto">
                  <Container
                    id="nextGameContainer"
                    items={items.nextGameContainer}
                  />
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
                <Hearts lives={7} livesLeft={7} size={"md"} />
              </div>
              <div className="flex justify-center space-x-2 mt-5">
                <LivesLeftComp
                  played={false}
                  won={false}
                  livesLeft={7}
                  lives={7}
                />
              </div>
              <div className="flex justify-center space-x-2 -mt-2 -mb-4">
                <MyBadgeGroup group={triviaryVer2Legend} />
              </div>
            </div>

            <div className="flex justify-left mt-5 rounded-lg bg-white shadow-sm border-dashed border-2 border-gray-600 overflow-x-auto">
              <div className="flex flex-row px-4 py-8">
                <div className="flex justify-start space-x-4">
                  <Container
                    id="timelineContainer"
                    items={items.timelineContainer}
                  />
                </div>
              </div>
            </div>
          </div>

          <DragOverlay>
            {activeItem ? (
              <GameCard
                card={findCard(activeItem, daList)}
                showTooltip={false}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </>
    )
  );

  function findContainer(id: string) {
    if (id in items) {
      return id;
    }

    return Object.keys(items).find((key) => items[key].includes(id));
  }

  function handleDragStart(event) {
    const { active } = event;
    const { id } = active;

    setActiveItem(id);
  }

  function handleDragOver(event) {
    const { active, over, draggingRect } = event;
    const { id } = active;
    const { id: overId } = over;

    // Find the containers
    const activeContainer = findContainer(id);
    const overContainer = findContainer(overId);

    if (
      !activeContainer ||
      !overContainer ||
      activeContainer === overContainer
    ) {
      return;
    }

    setItems((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];

      // Find the indexes for the items
      const activeIndex = activeItems.indexOf(id.toString);
      const overIndex = overItems.indexOf(overId.toString);

      let newIndex;
      if (overId in prev) {
        // We're at the root droppable of a container
        newIndex = overItems.length + 1;
      } else {
        const isBelowLastItem =
          over &&
          overIndex === overItems.length - 1 &&
          draggingRect?.offsetTop > over.rect.offsetTop + over.rect.height;

        const modifier = isBelowLastItem ? 1 : 0;

        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
      }

      return {
        ...prev,
        [activeContainer]: [
          ...prev[activeContainer].filter((item) => item !== active.id),
        ],
        [overContainer]: [
          ...prev[overContainer].slice(0, newIndex),
          items[activeContainer][activeIndex],
          ...prev[overContainer].slice(newIndex, prev[overContainer].length),
        ],
      };
    });
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    const { id } = active;
    const { id: overId } = over;

    const activeContainer = findContainer(id);
    const overContainer = findContainer(overId);

    if (
      !activeContainer ||
      !overContainer ||
      activeContainer !== overContainer
    ) {
      return;
    }

    const activeIndex = items[activeContainer].indexOf(active.id);
    const overIndex = items[overContainer].indexOf(overId);

    if (activeIndex !== overIndex) {
      setItems((items) => ({
        ...items,
        [overContainer]: arrayMove(
          items[overContainer],
          activeIndex,
          overIndex
        ),
      }));
    }

    setActiveItem(0);
  }
}
