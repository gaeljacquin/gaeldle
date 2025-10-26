import CoverArt2 from "@/views/cover-art-2";
import { redirect } from "next/navigation";

export default function CoverArt2Page() {
  if (process.env.NODE_ENV === 'development') {
    return <CoverArt2 />
  }

  redirect('/');
}
