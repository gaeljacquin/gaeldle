import { Heart } from "lucide-react"

type HeartsProps = {
  lives: number,
  livesLeft: number,
}

export default function Hearts({ lives, livesLeft }: HeartsProps) {
  return (
    Array.from({ length: lives }).map((_, index) => (
      <Heart
        key={index}
        className={`w-6 h-6 ${index < livesLeft ? 'text-red-600' : ''}`}
        fill={index < livesLeft ? 'currentColor' : 'none'}
      />
    ))
  )
}
