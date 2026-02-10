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
          <AlertDialogTitle>Reveal Hint</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to reveal a hint? This will cost 1 attempt.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-3 mt-4">
          <AlertDialogCancel
            onClick={onClose}
            className="flex-1 cursor-pointer font-bold h-10"
          >
            Cancel
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