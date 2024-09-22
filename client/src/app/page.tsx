import dynamic from 'next/dynamic'

const DynamicHome = dynamic(() => import('@/views/home'), {
  ssr: false,
})

export default function Page() {
  return (
    <>
      <DynamicHome />
    </>
  )
}
