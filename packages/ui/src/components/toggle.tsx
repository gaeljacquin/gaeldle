'use client';

import { Toggle as TogglePrimitive } from '@base-ui/react/toggle';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-none text-xs font-medium transition-all hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 aria-pressed:bg-accent aria-pressed:text-accent-foreground data-pressed:bg-accent data-pressed:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline:
          'border border-border bg-transparent hover:bg-muted hover:text-foreground aria-pressed:bg-accent aria-pressed:text-accent-foreground data-pressed:bg-accent data-pressed:text-accent-foreground',
      },
      size: {
        default: 'h-8 min-w-8 px-2.5',
        sm: 'h-7 min-w-7 px-2 text-xs',
        lg: 'h-9 min-w-9 px-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Toggle({
  className,
  variant,
  size,
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
