import { appInfo } from "@/lib/app-info";
import PrivacyView from "@/views/privacy";

export const metadata = {
  title: `Privacy Policy | ${appInfo.title}`,
};

export default function PrivacyPage() {
  return <PrivacyView />;
}
