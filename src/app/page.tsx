import { getModes } from '@/services/modes';
import Home from '@/views/home';

export default async function Page() {
  const modes = await getModes();

  return (
    <>
      <Home modes={modes} />
    </>
  );
}
