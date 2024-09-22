import dynamic from 'next/dynamic'

const DynamicSpecifications = dynamic(() => import('@/views/specifications'), {
  ssr: false,
})

export default async function Page() {
  return (
    <>
      <DynamicSpecifications />
    </>
  )
}
