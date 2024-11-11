import Image from 'next/image';
import Link from 'next/link';

export default function BMCButton() {
  return (
    <Link className="bmcButton" target="_blank" href="https://www.buymeacoffee.com/gaeljacquin">
      <Image
        className="bmcImage"
        src="https://cdn.buymeacoffee.com/buttons/bmc-new-btn-logo.svg"
        alt="Buy me a coffee logo"
        width={16}
        height={16}
      />
      <span className="bmcButtonText">Buy me a coffee</span>
    </Link>
  );
}
