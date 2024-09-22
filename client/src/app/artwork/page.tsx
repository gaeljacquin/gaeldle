import dynamic from 'next/dynamic'

const DynamicArtwork = dynamic(() => import('@/views/artwork'), {
  ssr: false,
})

export default async function Page() {
  return (
    <>
      <DynamicArtwork />
    </>
  )
}
