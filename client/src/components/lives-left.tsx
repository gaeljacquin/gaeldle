import { gameOverText, victoryText } from "@/lib/constants";

type LivesLeftCompProps = {
  played: boolean
  won: boolean
  livesLeft: number
}

export default function LivesLeftComp({ played, won, livesLeft }: LivesLeftCompProps) {
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
    if (won) {
      text = victoryText;
    } else {
      text = gameOverText;
    }

    classes += " text-xl font-semibold";
  }

  return (
    <>
      <p className={classes}>{text}</p>
    </>
  )
};
