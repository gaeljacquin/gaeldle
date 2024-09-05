// import AblyComp from "./ably-comp";

export default function MainDev() {
  return process.env.NODE_ENV === 'development' && (
    <>
      <div className="mt-10 text-center">
        {/* <AblyComp /> */}
      </div>
    </>
  )
}
