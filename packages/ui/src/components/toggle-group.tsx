'use client';

import * as React from 'react';
import { ToggleGroup as ToggleGroupPrimitive } from '@base-ui/react/toggle-group';
import { Toggle as TogglePrimitive } from '@base-ui/react/toggle';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { toggleVariants } from '@/components/toggle';

const toggleGroupVariants = cva(
  'inline-flex items-center justify-center gap-1 rounded-none border border-border bg-transparent p-0.5',
  {
    variants: {
      variant: {
        default: 'border-border bg-transparent',
        outline: 'border-border bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  size: 'default',
  variant: 'default',
});

function ToggleGroup<Value extends string = string>({
  className,
  variant = 'default',
  size = 'default',
  children,
  ...props
}: ToggleGroupPrimitive.Props<Value> & VariantProps<typeof toggleVariants>) {
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      className={cn(
        'inline-flex items-center justify-center gap-1 rounded-none border border-border p-0.5',
        className,
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive>
  );
}

function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext);

  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      className={cn(
        toggleVariants({
          variant: variant ?? context.variant,
          size: size ?? context.size,
        }),
        className,
      )}
      {...props}
    >
      {children}
    </TogglePrimitive>
  );
}

export { ToggleGroup, ToggleGroupItem, toggleGroupVariants };
