import dynamic from 'next/dynamic'
import Classic from '@/views/classic'
import { keyNameByEnv } from '@/lib/utils'

export default async function Page() {
  const AblyInit = dynamic(() => import('@/views/ably-init'), {
    ssr: false,
  })
  const channelName = keyNameByEnv("gotdClassic")

  return (
    <>
      <AblyInit channelName={channelName}>
        <Classic />
      </AblyInit>
    </>
  )
}
