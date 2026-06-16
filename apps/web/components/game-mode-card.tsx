import { MenuCard, type MenuCardProps } from '@/components/menu-card';
import { GameModeLevel } from '@workspace/api-contract';

interface GameModeCardProps extends Omit<MenuCardProps, 'badge'> {
  level: GameModeLevel;
}

export function GameModeCard(props: GameModeCardProps) {
  const badge = (
    <span className="absolute left-4 top-4 rounded-full bg-card/90 px-3 py-1 text-xs font-semibold tracking-wide text-foreground uppercase">
      {props.level}
    </span>
  );

  return <MenuCard {...props} badge={badge} />;
}
