import Sockets from "./sockets";

export default function MainDev() {
  return process.env.NODE_ENV === 'development' && (
    <>
      <Sockets />
    </>
  )
}
