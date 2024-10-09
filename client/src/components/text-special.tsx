import { bgTextSpecial1, bgTextSpecial2 } from "@/lib/server-constants";

type TextSpecialProps = {
  term1: string;
  term2: string;
  space?: boolean;
};

export default function TextSpecial({
  term1,
  term2,
  space = true,
}: TextSpecialProps) {
  return (
    <>
      <span className={`bg-clip-text text-transparent ${bgTextSpecial1}`}>
        {term1}
      </span>
      <span className={`text-transparent bg-clip-text ${bgTextSpecial2}`}>
        {space ? " " : ""}
        {term2}
      </span>
    </>
  );
}
