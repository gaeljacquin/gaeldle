import { ReactNode, Suspense } from "react";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col" style={{ backgroundColor: "#f5f5f0" }}>
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>
      <div className="flex-1">{children}</div>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}
