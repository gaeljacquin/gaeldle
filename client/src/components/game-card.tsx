import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Game } from "~/src/types/games";
import {
  cardImgSize,
  cardImgClasses,
  cardImgClassesAlt,
} from "~/src/lib/client-constants";

type GameCardProps = {
  card: Partial<Game>;
  showBar?: boolean;
};

const GameCard = (props: GameCardProps) => {
  const { card, showBar = true } = props;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            className="rounded-2xl overflow-x-auto shadow-md"
            style={{ width: cardImgSize }}
          >
            <CardContent className="p-0">
              <Image
                src={card?.imageUrl ?? ""}
                alt={card?.name ?? ""}
                width={cardImgSize}
                height={cardImgSize}
                className={cardImgClasses}
                style={{ objectFit: "cover" }}
                priority
              />
              {showBar && (
                <div className={`p-2 ${card?.bgStatus} text-center`}>
                  {card?.frdFormatted ? (
                    <p className="text-sm text-white font-semibold">
                      {card?.frdFormatted}
                    </p>
                  ) : (
                    <p className="text-sm text-white font-semibold">?</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent>
          <div>
            <Image
              src={card?.imageUrl ?? ""}
              alt={card?.name ?? ""}
              width={cardImgSize * 2}
              height={cardImgSize * 2}
              className={cardImgClassesAlt}
              style={{ objectFit: "cover" }}
              priority
            />
            <p className="text-center text-sm font-semibold">{card?.name}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default GameCard;
