import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface GameModeCardProps {
  href?: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  icon: LucideIcon;
  gradient: string;
  pattern?: "diagonal" | "diagonal-reverse";
  disabled?: boolean;
}

export default function GameModeCard({
  href,
  title,
  description,
  difficulty,
  icon: Icon,
  gradient,
  pattern = "diagonal",
  disabled = false,
}: GameModeCardProps) {
  const patternStyle = {
    backgroundImage: `repeating-linear-gradient(
      ${pattern === "diagonal" ? "45deg" : "-45deg"},
      transparent,
      transparent 10px,
      rgba(0,0,0,0.1) 10px,
      rgba(0,0,0,0.1) 20px
    )`,
  };

  const cardContent = (
    <Card
      className={`relative overflow-hidden border-2 border-slate-200 transition-all h-72 w-full ${
        disabled
          ? "opacity-75 cursor-not-allowed"
          : "hover:border-slate-300 hover:shadow-xl cursor-pointer"
      }`}
    >
      <div className={`absolute inset-0 ${gradient}`}>
        <div className="absolute inset-0 opacity-20" style={patternStyle} />
      </div>
      <CardContent className="relative h-full flex flex-col justify-between p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center bg-white/90 px-3 py-2 rounded-full">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              {difficulty}
            </span>
          </div>
          <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full">
            <Icon className="size-4 text-white" />
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
          <p className="text-white/90 text-sm leading-relaxed">{description}</p>
        </div>
      </CardContent>
    </Card>
  );

  if (disabled || !href) {
    return <div className="group w-full">{cardContent}</div>;
  }

  return (
    <div className="w-full sm:w-[calc(50%-0.5rem)] md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] min-w-[280px] max-w-md">
      <Link href={href} className="group w-full">
        {cardContent}
      </Link>
    </div>
  );
}
