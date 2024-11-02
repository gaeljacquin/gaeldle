import Hero from '@/components/hero';
import { getModes } from '@/services/modes';

export default async function Page() {
  const modes = await getModes();

  return (
    <>
      <Hero modes={modes} />
    </>
  );
}
