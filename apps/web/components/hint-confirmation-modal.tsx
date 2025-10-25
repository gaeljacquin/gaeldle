'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from './ui/button';
import { HoldToRevealButton } from './hold-to-reveal-button';

interface ClueConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReveal: () => void;
}

export default function HintConfirmationModal({ isOpen, onClose, onReveal }: ClueConfirmationModalProps) {
  const handleReveal = () => {
    onReveal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reveal Hint</DialogTitle>
          <DialogDescription>
            Are you sure you want to reveal a hint? This will cost 1 attempt.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 mt-4">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 cursor-pointer"
            size="lg"
          >
            Cancel
          </Button>
          <HoldToRevealButton
            onReveal={handleReveal}
            disabled={false}
            className="flex-1"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
