import dynamic from "next/dynamic";

const DynamicTriviary2 = dynamic(() => import("~/src/views/triviary2"), {
  ssr: false,
});

export default async function Page() {
  return (
    <>
      <DynamicTriviary2 />
    </>
  );
}
