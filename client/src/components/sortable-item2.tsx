"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import GameCard from "./game-card";
import { findCard } from "../lib/utils";
import zTriviaryVer2 from "../stores/triviary-ver2";

type ItemProps = {
  id: number;
};

export function Item(props: ItemProps) {
  const { id } = props;
  const { timeline, nextGame } = zTriviaryVer2();
  const daList = [...timeline, nextGame];
  const card = findCard(id, daList);

  return <GameCard card={card} showTooltip={false} />;
}

export default function SortableItem(props: ItemProps) {
  const { id } = props;
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Item id={id} />
    </div>
  );
}
