import dynamic from 'next/dynamic'

const DynamicClassic = dynamic(() => import('@/views/classic'), {
  ssr: false,
})

export default async function Page() {
  return (
    <>
      <DynamicClassic />
    </>
  )
}
