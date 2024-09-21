import dynamic from 'next/dynamic'

const DynamicKeywords = dynamic(() => import('@/views/keywords'), {
  ssr: false,
})

export default async function Page() {
  return (
    <>
      <DynamicKeywords />
    </>
  )
}
