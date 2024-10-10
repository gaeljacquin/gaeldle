import dynamic from "next/dynamic";

const DynamicTimeline = dynamic(() => import("@/views/timeline"), {
  ssr: false,
});

export default async function Page() {
  return (
    <>
      <DynamicTimeline />
    </>
  );
}
