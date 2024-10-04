import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  horizontalListSortingStrategy,
  SortableContext,
} from "@dnd-kit/sortable";
import SortableItem from "./sortable-item2";

type ContainerProps = {
  id: string;
  items: number[];
};

export default function Container(props: ContainerProps) {
  const { id, items } = props;

  const { setNodeRef } = useDroppable({
    id,
  });

  return (
    <SortableContext
      id={id}
      items={items}
      strategy={horizontalListSortingStrategy}
    >
      <div ref={setNodeRef}>
        {items.map((item: number) => (
          <SortableItem key={item ?? 0} id={item ?? 0} />
        ))}
      </div>
    </SortableContext>
  );
}
