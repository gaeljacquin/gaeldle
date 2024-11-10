'use client';

import Link from 'next/link';
import Modes from '@/components/modes';
// import ModesCarousel from '@/components/modes-carousel';
import TextSpecial from '@/components/text-special';
import { type Modes as ModesType } from '@/services/modes';
import { appinfo } from '@/utils/server-constants';

type Props = {
  modes: ModesType;
};

export default function Home(props: Props) {
  const { modes } = props;
  const titleFirstHalf = appinfo.title.slice(0, appinfo.title.length / 2 + 1);
  const titleSecondHalf = appinfo.title.slice(appinfo.title.length / 2 + 1);

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
        <Modes modes={modes} />
        {/* <ModesCarousel modes={modes} /> */}
      </div>
    </div>
  );
}
