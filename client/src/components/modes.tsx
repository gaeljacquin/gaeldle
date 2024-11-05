'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import Placeholders from '@/components/placeholders';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Mode, type Modes } from '@/services/modes';

type Props = {
  modes: Modes;
};

type Props2 = {
  label: string;
  description: string;
  slug: string;
  classNames: string;
  buttonKey: string;
};

export default function Modes(props: Props) {
  const { modes } = props;
  const [clickedButton, setClickedButton] = useState<string | null>(null);
  const readySetGo = modes;

  const handleClick = (buttonKey: string) => {
    if (clickedButton === null) {
      setClickedButton(buttonKey);
    }
  };

  const generateButtonKey = (label: string, index: number) => {
    return label + '-' + index;
  };

  const generateButton = (props2: Props2) => {
    const { label, description, slug, classNames, buttonKey } = props2;
    const isClicked = clickedButton === buttonKey;
    const isDisabled = clickedButton !== null;

    const buttonMarkup = () => {
      return (
        <Button
          className={`w-full shadow-lg text-lg ${classNames} ${isDisabled && !isClicked ? 'cursor-not-allowed' : ''}`}
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
          {description && (
            <TooltipContent>
              <p>{description}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="flex justify-center">
      <ul className="mt-7 space-y-8 max-w-xs w-full">
        {modes.map((mode: Mode, index: number) => {
          const buttonKey = generateButtonKey(mode.mode, index);

          return (
            <li key={mode.mode + '-' + index} className="flex items-center">
              {generateButton({
                label: mode.label ?? '',
                description: mode.description ?? '',
                slug: mode.mode,
                classNames: mode.classNames,
                buttonKey: buttonKey,
              })}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
