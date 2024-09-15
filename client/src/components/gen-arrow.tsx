import { ArrowUp, ArrowDown, Check } from "lucide-react";

export default function GenArrow(text: string, arrowDir: string, specscn: string) {
  let finalComp;

  switch (arrowDir) {
    case "up":
      finalComp = <ArrowUp className="w-10 h-10 mb-1" />
      break;
    case "down":
      finalComp = <ArrowDown className="w-10 h-10 mb-1" />
      break;
    default:
      finalComp = <Check className="w-10 h-10 mb-1" />
      break;
  }

  return (
    <div className={`relative inline-flex flex-col items-center justify-center w-20 h-20 text-base rounded-full text-white ${specscn}`}>
      {finalComp}
      <span className="text-center font-medium">{text}</span>
    </div>
  );
};
