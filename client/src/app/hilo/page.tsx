import dynamic from "next/dynamic";

const DynamicHilo = dynamic(() => import("~/src/views/hilo"), {
  ssr: false,
});

export default async function Page() {
  return (
    <>
      <DynamicHilo />
    </>
  );
}
