import Link from 'next/link';

export default function About() {
  return (
    <div className="flex flex-col bg-background">
      <div className="flex-1">
        <div className="container max-w-4xl py-6 lg:py-10">
          <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between md:gap-8">
            <div className="flex-1 space-y-4">
              <h1 className="inline-block font-heading text-4xl tracking-tight lg:text-5xl">
                About
              </h1>
              <p className="text-xl text-muted-foreground">Gaeldle</p>
            </div>
          </div>
          <>
            <section className="prose prose-slate dark:prose-invert max-w-none">
              <section>
                <p>A game celebrating games, for casual and hardcore gamers alike!</p>
                <p>
                  Inspired by{' '}
                  <Link
                    href="https://www.nytimes.com/games/wordle/index.html"
                    target="_blank"
                    className="text-gael-blue hover:text-gael-blue-dark hover:underline"
                  >
                    Wordle
                  </Link>
                  ,{' '}
                  <Link
                    href="https://wikitrivia.tomjwatson.com/"
                    target="_blank"
                    className="text-gael-blue hover:text-gael-blue-dark hover:underline"
                  >
                    Wiki Trivia
                  </Link>
                  , the{' '}
                  <Link
                    href="https://www.higherlowergame.com/"
                    target="_blank"
                    className="text-gael-blue hover:text-gael-blue-dark hover:underline"
                  >
                    Higher Lower Game
                  </Link>
                  ,{' '}
                  <Link
                    href="https://www.gamedle.wtf/?lang=en"
                    target="_blank"
                    className="text-gael-blue hover:text-gael-blue-dark hover:underline"
                  >
                    Gamedle
                  </Link>
                  , and{' '}
                  <Link
                    href="https://medium.com/floodgates/the-complete-and-authoritative-list-of-wordle-spinoffs-fb00bfafc448"
                    target="_blank"
                    className="text-gael-blue hover:text-gael-blue-dark hover:underline"
                  >
                    all the other spinoffs
                  </Link>
                  .
                </p>
                {/* <p>
            New games and artwork are picked daily from an ever-growing list of
            games. The list, cover images and artwork are sourced from{" "}
            <Link
              href="https://www.igdb.com/"
              target="_blank"
              className="text-gael-blue hover:text-gael-blue-dark hover:underline"
            >
              IGDB
            </Link>
            .
          </p> */}
                <p>All rights go to the rightful owners - no copyright infringement intended.</p>
                <p>
                  View our{' '}
                  <Link
                    href="/privacy"
                    className="text-gael-blue hover:text-gael-blue-dark hover:underline"
                  >
                    Privacy Policy
                  </Link>{' '}
                  and{' '}
                  <Link
                    href="/tos"
                    className="text-gael-blue hover:text-gael-blue-dark hover:underline"
                  >
                    Terms of Service
                  </Link>
                </p>
              </section>
            </section>
          </>
        </div>
      </div>
    </div>
  );
}
