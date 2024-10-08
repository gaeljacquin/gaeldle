import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  horizontalListSortingStrategy,
  SortableContext,
} from "@dnd-kit/sortable";
import SortableItem2 from "./sortable-item2";

type ContainerProps = {
  id: string;
  items: number[];
  showTooltip: boolean;
};

export default function Container(props: ContainerProps) {
  const { id, items, showTooltip } = props;
  const { setNodeRef } = useDroppable({
    id,
  });

  return (
    <SortableContext
      id={id}
      items={items}
      strategy={horizontalListSortingStrategy}
    >
      {items.map((item) => (
        <div
          ref={setNodeRef}
          key={item}
          className="flex items-center space-x-4"
        >
          <SortableItem2 id={item} showTooltip={showTooltip} />
        </div>
      ))}
    </SortableContext>
  );
}
