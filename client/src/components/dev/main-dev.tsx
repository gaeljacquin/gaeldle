import Sockets from "./sockets";

export default function MainDev() {
  return process.env.NODE_ENV === 'development' && (
    <>
      <div className="mt-10 text-center">
        <Sockets />
      </div>
    </>
  )
}
