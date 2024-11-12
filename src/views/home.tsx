'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import Modes from '@/components/modes';
import ModesCarousel from '@/components/modes-carousel';
import { Notifications } from '@/components/notifications';
import TextSpecial from '@/components/text-special';
import { Button } from '@/components/ui/button';
import { type Modes as ModesType } from '@/services/modes';
import zHome from '@/stores/home';
import { appinfo } from '@/utils/server-constants';

type Props = {
  modes: ModesType;
};

export default function Home(props: Props) {
  const { modes } = props;
  const { menuType, setMenuType } = zHome();
  const titleFirstHalf = appinfo.title.slice(0, appinfo.title.length / 2 + 1);
  const titleSecondHalf = appinfo.title.slice(appinfo.title.length / 2 + 1);
  const [modeSelected, setModeSelected] = useState<boolean>(false);

  return (
    <div role="main" className="flex-grow items-center space-y-8 p-4">
      <div className="container text-center mt-10">
        <div className="max-w-3xl mx-auto mb-2">
          <h1 className="text-6xl font-extrabold mb-5">
            <TextSpecial term1={`${titleFirstHalf}`} term2={`${titleSecondHalf}`} space={false} />
          </h1>
          <p className="text-3xl justify-center text-center">
            {appinfo.description.split('Wordle')[0]}{' '}
            <Link
              className="text-gael-blue hover:text-gael-blue-dark hover:underline"
              href="https://www.nytimes.com/games/wordle"
              target="_blank"
            >
              Wordle
            </Link>{' '}
            {appinfo.description.split('Wordle')[1]}
          </p>
        </div>

        <div>
          <Notifications />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={menuType + '-motion'}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {!menuType && (
              <div className="flex mt-10 justify-center items-center space-x-4">
                <Loader2 className="h-8 w-8 mt-1 animate-spin" />
              </div>
            )}
            {menuType === 'list' && (
              <div className="mt-7 mb-32">
                <Modes
                  modes={modes}
                  setModeSelected={setModeSelected}
                  modeSelected={modeSelected}
                />
              </div>
            )}
            {menuType === 'carousel' && (
              <div className="-mt-20 -mb-12">
                <ModesCarousel
                  modes={modes}
                  setModeSelected={setModeSelected}
                  modeSelected={modeSelected}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex justify-center items-center space-x-4">
        <motion.div className="underline mt-10" layoutId="underline">
          {menuType === 'list' && (
            <Button
              onClick={() => setMenuType('carousel')}
              variant="outline"
              size="lg"
              disabled={modeSelected}
            >
              Carousel View
            </Button>
          )}
          {menuType === 'carousel' && (
            <Button
              onClick={() => setMenuType('list')}
              variant="outline"
              size="lg"
              disabled={modeSelected}
            >
              List View
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
