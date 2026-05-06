import Link from 'next/link';
import { type TablerIcon } from '@tabler/icons-react';
import { cn } from '@workspace/ui/lib/utils';

export interface MenuCardProps {
  href?: string;
  title: string;
  description: string;
  icon: TablerIcon;
  gradient: string;
  disabled?: boolean;
  badge?: React.ReactNode;
}

export function MenuCard({
  href,
  title,
  description,
  icon: Icon,
  gradient,
  disabled = false,
  badge,
}: Readonly<MenuCardProps>) {
  const cardContent = (
    <div
      className={cn(
        'group relative flex h-44 w-full flex-col justify-end overflow-hidden rounded-xl p-5 text-left transition-all duration-300',
        'hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]',
        disabled && 'cursor-not-allowed opacity-70',
      )}
      style={{ background: `var(${gradient})` }}
    >
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: 'var(--gradient-card-overlay)' }}
      />

      {badge}

      <div className="absolute right-4 top-4 rounded-lg bg-card/20 p-2 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
        <Icon size={20} className="text-primary-foreground" />
      </div>

      <div className="relative z-10">
        <h2 className="text-xl font-bold text-primary-foreground">{title}</h2>
        <p className="mt-1 text-sm text-primary-foreground/80">{description}</p>
      </div>
    </div>
  );

  if (disabled || !href) {
    return <div className="group w-full">{cardContent}</div>;
  }

  return (
    <Link href={href} className="block w-full">
      {cardContent}
    </Link>
  );
}
