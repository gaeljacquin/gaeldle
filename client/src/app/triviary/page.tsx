import dynamic from 'next/dynamic'

const DynamicTriviary = dynamic(() => import('@/views/triviary'), {
  ssr: false,
})

export default async function Page() {
  return (
    <>
      <DynamicTriviary />
    </>
  )
}
