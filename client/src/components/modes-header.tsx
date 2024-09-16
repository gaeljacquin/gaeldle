import { Mode } from "@/types/modes";

export default function ModesHeader({ mode }: { mode: Mode }) {
  return (
    <div className="mb-8 text-xl text-center font-semibold">
      <p>{mode.label}</p>
      <p>{mode.description}</p>
    </div>
  )
}
