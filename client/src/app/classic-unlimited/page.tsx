import dynamic from 'next/dynamic'
import ClassicUnlimited from '@/views/classic-unlimited';

export default async function Page() {
  const AblyInit = dynamic(() => import('@/views/ably-init'), {
    ssr: false,
  })
  const channelName = "unlimitedStats";

  return (
    <>
      <AblyInit channelName={channelName}>
        <ClassicUnlimited />
      </AblyInit>
    </>
  )
}
