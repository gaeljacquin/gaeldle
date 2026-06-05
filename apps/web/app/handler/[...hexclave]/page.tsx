import { HexclaveHandler } from '@hexclave/next';

export default function Handler() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <HexclaveHandler fullPage={false} />
    </div>
  );
}
