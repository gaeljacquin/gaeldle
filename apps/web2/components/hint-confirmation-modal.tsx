'use client';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import HoldToRevealButton from '@/components/hold-to-reveal-button';

interface HintConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReveal: () => void;
}

export default function HintConfirmationModal({ isOpen, onClose, onReveal }: Readonly<HintConfirmationModalProps>) {
  const handleReveal = () => {
    onReveal();
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="uppercase tracking-widest text-primary">Signal Interception</AlertDialogTitle>
          <AlertDialogDescription className="uppercase tracking-tight text-[10px]">
            Are you sure you want to intercept a hint? This will consume 1 attempt authorization.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-3 mt-4">
          <AlertDialogCancel
            onClick={onClose}
            className="flex-1 cursor-pointer uppercase tracking-widest text-[10px] font-bold h-10"
          >
            Abort
          </AlertDialogCancel>
          <HoldToRevealButton
            onReveal={handleReveal}
            disabled={false}
            className="flex-1"
          />
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
