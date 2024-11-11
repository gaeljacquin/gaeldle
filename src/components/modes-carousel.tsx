import { ReactNode, useState } from 'react';
import Link from 'next/link';
import styled from '@emotion/styled';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import {
  AnimationCard,
  AnimationCardContent,
  TransitionGridWrapper,
} from '@/components/animation-card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Modes } from '@/services/modes';

function CardWrapper({ children }: { children: ReactNode }) {
  return <div className="relative h-[200px]">{children}</div>;
}

const Card = styled('div')`
  transform: perspective(1000px) rotateY(15deg);
  transition: transform 0.8s ease 0s;

  &:hover {
    transform: perspective(2000px) rotateY(2deg);
  }
`;

interface Props {
  withAnimatePresence?: boolean;
  modes: Modes;
  modeSelected: boolean;
  setModeSelected: (modeSelected: boolean) => void;
}

const ModesContent = (props: Props) => {
  const { withAnimatePresence, modes, modeSelected, setModeSelected } = props;
  const [selected, setSelected] = useState(0);
  const [buttonAboutToBeClicked, setAboutToBeClicked] = useState('next');

  const next = () => {
    if (selected === modes.length - 1) {
      setSelected(0);
    } else {
      setSelected((prev) => prev + 1);
    }
  };

  const prev = () => {
    if (selected === 0) {
      setSelected(modes.length - 1);
    } else {
      setSelected((prev) => prev - 1);
    }
  };

  const cardVariants = {
    initial: (next: boolean) => ({
      x: next ? -500 : 500,
    }),
    animate: {
      x: -125,
      transition: {
        duration: 0.4,
        //delay: 0.2,
      },
    },
    exit: (next: boolean) => ({
      x: next ? 500 : -500,
      transition: {
        duration: 0.4,
      },
    }),
  };

  const WrapperComponent = withAnimatePresence
    ? AnimatePresence
    : (props: { children: ReactNode }) => <div {...props} />;

  return (
    <div className="relative flex items-center justify-center w-full h-64">
      <Button
        variant={'outline'}
        size={'icon'}
        className="absolute left-2 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-200 focus:outline-none mt-16"
        onMouseEnter={() => setAboutToBeClicked('prev')}
        onClick={prev}
        disabled={modeSelected}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous</span>
      </Button>

      <CardWrapper>
        {modes.map((mode, index) => {
          return (
            <div key={`${mode.mode ?? index}-shrug`}>
              <WrapperComponent key={`${mode.mode ?? index}-wrap`}>
                {index === selected ? (
                  <motion.div
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={cardVariants}
                    custom={buttonAboutToBeClicked === 'next'}
                  >
                    <Card key={`${mode.mode ?? index}-card`}>
                      <TooltipProvider>
                        <Tooltip key={`${mode.mode ?? index}-tooltip`}>
                          <TooltipTrigger asChild>
                            <Link
                              href={modeSelected ? '#' : `/${mode.mode}`}
                              className={`${mode.classNames} absolute flex flex-col justify-center items-center w-[250px] h-[300px] mb-0 overflow-hidden rounded-[32px] text-white ${modeSelected ? 'pointer-events-none opacity-50' : ''}`}
                              onClick={() => setModeSelected(true)}
                              key={`${mode.mode ?? index}-link`}
                            >
                              <h1 className="text-2xl">{mode.label}</h1>
                              {modeSelected && <Loader2 className="h-8 w-8 mt-1 animate-spin" />}
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p
                              className="flex items-center justify-center w-full h-full text-center text-sm"
                              key={`${mode.mode ?? index}-tooltip-content`}
                            >
                              {mode.description === '' ? '🙃' : mode.description}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Card>
                  </motion.div>
                ) : null}
              </WrapperComponent>
            </div>
          );
        })}
      </CardWrapper>

      <Button
        variant={'outline'}
        size={'icon'}
        className="absolute right-2 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-200 focus:outline-none mt-16"
        onMouseEnter={() => setAboutToBeClicked('next')}
        onClick={next}
        disabled={modeSelected}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next</span>
      </Button>
    </div>
  );
};

const FramerMotionAnimatePresence = (props: Props) => {
  return (
    <TransitionGridWrapper>
      <AnimationCard>
        <AnimationCardContent>
          <ModesContent withAnimatePresence {...props} />
        </AnimationCardContent>
      </AnimationCard>
    </TransitionGridWrapper>
  );
};

export default FramerMotionAnimatePresence;
