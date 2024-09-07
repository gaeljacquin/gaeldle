import dynamic from 'next/dynamic'
import GuessNumber from '@/components/dev/guess-number'

export default async function Dev() {
  const AblyInit = dynamic(() => import('@/views/ably-init'), {
    ssr: false,
  })
  const channelName = "gnumber"

  return (
    <>
      <AblyInit channelName={channelName}>
        <GuessNumber />
      </AblyInit>
    </>
  )
}
