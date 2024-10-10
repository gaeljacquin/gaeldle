import dynamic from "next/dynamic";

const DynamicTimeline2 = dynamic(() => import("~/src/views/timeline2"), {
  ssr: false,
});

export default async function Page() {
  return (
    <>
      <DynamicTimeline2 />
    </>
  );
}
