import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";

export default function BackToMainMenu() {
  return (
    <Link
      href="/"
      className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
    >
      <IconArrowLeft className="size-4" />
      Main Menu
    </Link>
  )
}
