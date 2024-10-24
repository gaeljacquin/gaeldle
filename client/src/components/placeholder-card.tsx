import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { cardImgSize, placeholderImage } from "~/src/lib/client-constants";

const PlaceholderCard = () => {
  return (
    <Card
      className="rounded-2xl overflow-x-auto shadow-md"
      style={{ width: cardImgSize }}
    >
      <CardContent className="p-0">
        <Image
          src={`${placeholderImage.url}`}
          alt={`${placeholderImage.alt}`}
          width={cardImgSize}
          height={cardImgSize}
          style={{ objectFit: "cover" }}
          priority
        />
        <div className={`p-2 bg-gray-400 text-center`}>
          <p className="text-sm text-white font-semibold">&nbsp;</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlaceholderCard;
