'use client';

import { Button } from '@workspace/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/ui/alert-dialog';
import { IconChecklist, IconTrash, IconRestore } from '@tabler/icons-react';
import { cn } from '@workspace/ui/lib/utils';
import type { UseBulkDeleteReturn } from '@/lib/hooks/use-bulk-delete';

export interface BulkDeleteControlsProps {
  bulkDelete: UseBulkDeleteReturn;
}

export function BulkDeleteControls({ bulkDelete }: BulkDeleteControlsProps) {
  const {
    isMultiSelect,
    toggleMultiSelect,
    selectedIds,
    clearSelection,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    handleBulkDelete,
    isPending,
    locationName,
  } = bulkDelete;

  return (
    <div className="flex flex-row-reverse md:flex-row items-center gap-4">
      <Button
        variant={isMultiSelect ? 'default' : 'outline'}
        size="icon-lg"
        onClick={toggleMultiSelect}
        title="Multi-select"
        className={cn(
          'cursor-pointer size-10',
          isMultiSelect && 'bg-primary text-primary-foreground',
        )}
      >
        <IconChecklist size={22} />
      </Button>

      {isMultiSelect ? (
        <div className="flex items-center gap-4 animate-in fade-in md:slide-in-from-left-4 slide-in-from-right-4 duration-300">
          <AlertDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <Button
              variant="default"
              size="sm"
              disabled={selectedIds.size === 0 || isPending}
              onClick={() => setIsDeleteDialogOpen(true)}
              className={cn(
                'h-10 bg-destructive text-destructive-foreground hover:bg-destructive/90',
                selectedIds.size === 0 || isPending
                  ? 'cursor-not-allowed'
                  : 'cursor-pointer',
              )}
            >
              <IconTrash size={16} className="mr-2" />
              Delete ({selectedIds.size})
            </Button>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete{' '}
                  {selectedIds.size} {selectedIds.size === 1 ? 'game' : 'games'}{' '}
                  from {locationName}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="cursor-pointer">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={handleBulkDelete}
                  className="cursor-pointer"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            variant="outline"
            size="sm"
            onClick={clearSelection}
            disabled={selectedIds.size === 0}
            className={cn(
              'h-10',
              selectedIds.size === 0 || isPending
                ? 'cursor-not-allowed'
                : 'cursor-pointer',
            )}
          >
            <span className="flex flex-row gap-2">
              <IconRestore size={16} />
              Clear
            </span>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
