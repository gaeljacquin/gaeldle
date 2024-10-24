import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Loader2, Link } from "lucide-react";
import { Button } from "./ui/button";

type generateButtonProps = {
  label: string;
  description: string;
  slug: string;
  classNames: string;
  isNew: boolean;
  buttonKey: string;
  clickedButton: string;
  handleClick: (arg0: string) => void;
};

const generateButton = ({
  label,
  description,
  slug,
  classNames,
  isNew,
  buttonKey,
  clickedButton,
  handleClick,
}: generateButtonProps) => {
  const isClicked = clickedButton === buttonKey;
  const isDisabled = clickedButton !== null;

  const buttonMarkup = () => {
    return (
      <Button
        className={`w-full ${classNames} ${isNew && "shadow-animate"} ${isDisabled && !isClicked ? "cursor-not-allowed" : ""}`}
        onClick={() => handleClick(buttonKey)}
        disabled={isClicked}
        aria-disabled={isDisabled && !isClicked}
      >
        {isClicked && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {label}
      </Button>
    );
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            className="flex justify-center w-full"
            href={`/${slug}`}
            aria-disabled={isDisabled && !isClicked}
          >
            {buttonMarkup()}
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default generateButton;
