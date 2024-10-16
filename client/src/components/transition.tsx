import { Loader2 } from "lucide-react";

export default function Transition() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      aria-hidden="true"
    >
      <Loader2 className="w-8 h-8 text-white animate-spin" />
    </div>
  );
}
