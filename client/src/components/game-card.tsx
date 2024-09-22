import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Game } from "~/src/types/games";
import { cardImgSize, cardImgClasses } from "~/src/lib/constants";

type GameCardProps = {
  card: Partial<Game>;
  showBar?: boolean;
}

const GameCard = (props: GameCardProps) => {
  const { card, showBar = true } = props;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="rounded-lg overflow-hidden shadow-lg">
            <CardContent className="p-0">
              <Image
                src={card?.imageUrl ?? ''}
                alt={card?.name ?? ''}
                width={cardImgSize}
                height={cardImgSize}
                className={cardImgClasses}
                style={{ objectFit: "cover" }}
                priority
              />
              {showBar &&
                <div className={`p-2 ${card?.bgStatus} text-center`}>
                  {card?.frdFormatted ?
                    <p className="text-sm text-white font-semibold">{card?.frdFormatted}</p>
                    : <p className="text-sm text-white font-semibold">?</p>
                  }
                </div>
              }
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent>
          <p>{card?.name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default GameCard;
