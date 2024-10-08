"use client";

import { CSSProperties } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import GameCard from "./game-card";
import { findCard } from "../lib/utils";
import zTimeline2 from "../stores/timeline2";

type idgafProps = {
  id: number;
  isOpacityEnabled?: boolean;
  isDragging?: boolean;
  style?: object;
  showTooltip?: boolean;
};

export function Item2(props: idgafProps) {
  const { id, isOpacityEnabled, isDragging, style, showTooltip } = props;
  const { timeline, nextGame } = zTimeline2();
  const card = timeline
    ? findCard(id, [...timeline, nextGame ? nextGame : {}])
    : null;
  const styles: CSSProperties = {
    opacity: isOpacityEnabled ? "0.4" : "1",
    cursor: isDragging ? "grabbing" : "grab",
    lineHeight: "0.5",
    transform: isDragging ? "scale(1.05)" : "scale(1)",
    ...style,
  };

  return (
    card && (
      <div style={styles}>
        <GameCard card={card} showTooltip={!isDragging && showTooltip} />
      </div>
    )
  );
}

export default function SortableItem2({ id, ...props }: idgafProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const styles = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} {...attributes} {...listeners}>
      <Item2 id={id} isOpacityEnabled={isDragging} style={styles} {...props} />
    </div>
  );
}
