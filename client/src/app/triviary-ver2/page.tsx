import dynamic from "next/dynamic";

const DynamicTriviaryVer2 = dynamic(() => import("@/views/triviary-ver2"), {
  ssr: false,
});

export default async function Page() {
  return (
    <>
      <DynamicTriviaryVer2 />
    </>
  );
}
