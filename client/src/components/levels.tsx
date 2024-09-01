import { Badge } from "@/components/ui/badge"

export default function Levels() {
  return (
    <div className="mt-10 text-center">
      <div className="flex space-x-4 w-full justify-center items-center mb-5">
        <Badge className="text-md bg-gael-green hover:bg-gael-green">Easy</Badge>
        <Badge className="text-md bg-yellow-600 hover:bg-yellow-600">Moderate</Badge>
        <Badge className="text-md bg-gael-red hover:bg-gael-red">Hard</Badge>
      </div>
    </div>
  )
}
