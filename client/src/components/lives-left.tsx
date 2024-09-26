import { textGameOver, textVictory, textFlawlessVictory } from "@/lib/constants";

type LivesLeftCompProps = {
  played: boolean
  won: boolean
  livesLeft: number
  lives: number
}

export default function LivesLeftComp({ played, won, livesLeft, lives }: LivesLeftCompProps) {
  let text = "";
  let classes = "-mt-3 -mb-7";

  if (!played) {
    text = `${livesLeft} `;

    if (livesLeft === 1) {
      text += "life";
    } else {
      text += "lives";
    }

    text += " remaining";
  } else {
    if (livesLeft === lives) {
      text = textFlawlessVictory;
    } else if (won) {
      text = textVictory;
    } else {
      text = textGameOver;
    }

    classes += " text-xl font-semibold";
  }

  return (
    <>
      <p className={classes}>{text}</p>
    </>
  )
};
