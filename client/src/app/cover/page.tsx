import dynamic from "next/dynamic";

const DynamicCover = dynamic(() => import("@/views/cover"), {
  ssr: false,
});

export default async function Page() {
  return (
    <>
      <DynamicCover />
    </>
  );
}
