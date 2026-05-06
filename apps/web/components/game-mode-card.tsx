import { MenuCard, type MenuCardProps } from '@/components/menu-card';

interface GameModeCardProps extends Omit<MenuCardProps, 'badge'> {
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export function GameModeCard({
  difficulty,
  ...rest
}: Readonly<GameModeCardProps>) {
  const badge = (
    <span className="absolute left-4 top-4 rounded-full bg-card/90 px-3 py-1 text-xs font-semibold tracking-wide text-foreground">
      {difficulty.toUpperCase()}
    </span>
  );

  return <MenuCard {...rest} badge={badge} />;
}
