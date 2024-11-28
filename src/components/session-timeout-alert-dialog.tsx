'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

type Props = {
  isOpen: boolean;
  setIsOpen: (arg0: boolean) => void;
};

export function SessionTimeoutAlertDialog(props: Props) {
  const { isOpen, setIsOpen } = props;
  const [clicked, setClicked] = useState(false);

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session timed out</AlertDialogTitle>
          <AlertDialogDescription>
            Please refresh the page or click the button below
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            onClick={() => {
              setClicked(true);
              window.location.reload();
            }}
            disabled={clicked}
          >
            Play again
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
