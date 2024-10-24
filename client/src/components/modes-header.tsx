import { Mode } from "@/types/modes";
import TextSpecial from "@/components/text-special";

export default function ModesHeader({ mode }: { mode: Mode }) {
  const labelFirstHalf = mode.label.slice(0, mode.label.length / 2);
  const labelSecondHalf = mode.label.slice(mode.label.length / 2);
  const descriptionFirstHalf =
    mode.description?.slice(0, mode.description?.length / 2) ?? "";
  const descriptionSecondHalf =
    mode.description?.slice(mode.description?.length / 2) ?? "";

  return (
    <div className="mt-10 mb-8 text-center font-semibold rounded-lg p-4">
      <h1 className="text-5xl font-extrabold mb-4">
        <TextSpecial
          term1={labelFirstHalf}
          term2={labelSecondHalf}
          space={false}
        />
      </h1>
      <p className="text-2xl">
        <TextSpecial
          term1={descriptionFirstHalf}
          term2={descriptionSecondHalf}
          space={false}
          reverse={true}
        />
      </p>
    </div>
  );
}
