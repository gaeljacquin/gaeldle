import { appInfo } from "@/lib/app-info";
import TermsView from "@/views/terms";

export const metadata = {
  title: `Terms of Service | ${appInfo.title}`,
};

export default function TermsPage() {
  return <TermsView />;
}
