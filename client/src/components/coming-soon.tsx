import Link from "next/link";

export default function ComingSoon() {
  return (
    <div className="max-w-3xl mx-auto mt-5 mb-10 text-center">
      <p className="text-xl">More game modes and features coming soon!</p>
      <p className="text-md">
        In the meantime, check out
        {' '}
        <Link
          href={`${process.env.smashQuizUrl}`}
          target="_blank"
          className="text-gael-blue hover:text-gael-blue-dark hover:underline"
        >
          Smash Quiz
        </Link>
      </p>
    </div>
  )
}
