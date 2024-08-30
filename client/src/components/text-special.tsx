type TextSpecialProps = {
  term1: string
  term2: string
  space?: boolean
}

export default function TextSpecial({ term1, term2, space = true }: TextSpecialProps) {
  return (
    <>
      <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">{term1}</span>
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-gael-purple to-red-500">
        {space ? " " : ""}
        {term2}
      </span>
    </>
  )
}
