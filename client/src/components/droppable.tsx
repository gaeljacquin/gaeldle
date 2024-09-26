'use client'

import { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';

interface DroppableProps {
  children: ReactNode;
  id: string
}

export default function Droppable(props: DroppableProps) {
  const { setNodeRef } = useDroppable({
    id: props.id,
  });

  return (
    <div ref={setNodeRef}>
      {props.children}
    </div>
  );
}
