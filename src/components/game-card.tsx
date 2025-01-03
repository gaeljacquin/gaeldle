import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Game } from '@/services/games';
import {
  bgCorrect,
  bgIncorrect,
  bgPartial,
  cardImgClasses,
  cardImgClassesAlt,
  cardImgSize,
} from '@/utils/client-constants';

type GameCardProps = {
  card: Partial<Game>;
  showBar?: boolean;
  showTooltip?: boolean;
  showPos?: boolean;
};

const GameCard = (props: GameCardProps) => {
  const { card, showBar = true, showTooltip = true, showPos = false } = props;

  const posComp = (index: number) => {
    return <span className="text-white text-xl font-semibold">{index + 1}</span>;
  };

  const daCard = () => {
    return (
      <Card
        className="relative rounded-2xl overflow-x-auto shadow-md"
        style={{ width: cardImgSize }}
      >
        <CardContent className="p-0">
          <Image
            src={card?.imageUrl ?? ''}
            alt={card?.name ?? ''}
            width={cardImgSize}
            height={cardImgSize}
            className={cn(
              cardImgClasses,
              (card.bgStatus === bgCorrect || card.bgStatus === bgPartial) && `contrast-50`
            )}
            style={{ objectFit: 'cover' }}
            priority
          />
          {(card.bgStatus === bgIncorrect || card.bgStatus === bgPartial) && showPos && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
              {posComp((card.bgStatus === bgPartial ? card?.correctIndex : card?.latestIndex) ?? 0)}
            </div>
          )}
          {showBar && (
            <div className={`p-2 ${card?.bgStatus} text-center`}>
              {card?.frdFormatted ? (
                <p className="text-sm text-white font-semibold">{card?.frdFormatted}</p>
              ) : (
                <p className="text-sm text-white font-semibold">
                  {card?.proximity ?? '?'}
                  {card?.proximity && '%'}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (!showTooltip) {
    return daCard();
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{daCard()}</TooltipTrigger>
        <TooltipContent>
          <div>
            <Image
              src={card?.imageUrl ?? ''}
              alt={card?.name ?? ''}
              width={cardImgSize * 2}
              height={cardImgSize * 2}
              className={cardImgClassesAlt}
              style={{ objectFit: 'cover' }}
              priority
            />
            <Badge className="flex items-center justify-center mt-4 mb-2 bg-gael-blue text-white text-lg font-light">
              {card?.name}
            </Badge>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default GameCard;
