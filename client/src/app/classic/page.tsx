import dynamic from 'next/dynamic'
import Classic from '@/views/classic'

export default async function Page() {
  const AblyInit = dynamic(() => import('@/views/ably-init'), {
    ssr: false,
  })
  const channelName = "dailyStats"

  return (
    <>
      <AblyInit channelName={channelName}>
        <Classic />
      </AblyInit>
    </>
  )
}
