'use client'

import { ReactNode } from 'react';
import { useDraggable } from '@dnd-kit/core';

interface DraggableProps {
  children: ReactNode;
  id: string;
  item: unknown;
}

export default function Draggable(props: DraggableProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: props.id,
    data: { item: props.item }
  });
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <button ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {props.children}
    </button>
  );
}
