import { appInfo } from "@/lib/app-info";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto py-6 px-4 sm:px-6 lg:px-8 border-t bg-transparent">
      <div className="max-w-6xl mx-auto text-center text-muted-foreground">
        <p>&copy; 2025 {currentYear > 2025 && <span>- {new Date().getFullYear()}</span>} {appInfo.author}. All rights reserved.</p>
      </div>
    </footer>
  );
}
