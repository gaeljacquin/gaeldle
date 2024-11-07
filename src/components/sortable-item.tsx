import React from 'react';
import type { PropsWithChildren } from 'react';
import type { UniqueIdentifier } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  id: UniqueIdentifier;
  disabled: boolean;
}

export default function SortableItem({ children, ...props }: PropsWithChildren<Props>) {
  const { id, disabled } = props;
  const { attributes, listeners, setNodeRef, transform, transition, active } = useSortable({
    id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={active && id === active.id ? 'shadow-animate rounded-2xl' : ''}
    >
      {children}
    </div>
  );
}
