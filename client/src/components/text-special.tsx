import { bgTextSpecial1, bgTextSpecial2 } from "@/lib/server-constants";

type TextSpecialProps = {
  term1: string;
  term2: string;
  space?: boolean;
  reverse?: boolean;
};

export default function TextSpecial({
  term1,
  term2,
  space = true,
  reverse = false,
}: TextSpecialProps) {
  return (
    <>
      <span
        className={`bg-clip-text text-transparent ${reverse ? bgTextSpecial2 : bgTextSpecial1}`}
      >
        {term1}
      </span>
      <span
        className={`bg-clip-text text-transparent ${reverse ? bgTextSpecial1 : bgTextSpecial2}`}
      >
        {space ? " " : ""}
        {term2}
      </span>
    </>
  );
}
