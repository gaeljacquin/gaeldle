'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteBulkGames } from '@/lib/services/game.service';
import { toast } from 'sonner';

export interface UseBulkDeleteOptions {
  queryKeysToInvalidate: (string | unknown[])[];
  entityName?: string;
  locationName?: string;
}

export function useBulkDelete({
  queryKeysToInvalidate,
  entityName = 'game',
  locationName = 'your library',
}: UseBulkDeleteOptions) {
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (ids: number[]) => deleteBulkGames(ids),
    onSuccess: () => {
      const count = selectedIds.size;
      const successMessage = `${count} ${count === 1 ? entityName : `${entityName}s`} deleted successfully`;

      for (const queryKey of queryKeysToInvalidate) {
        queryClient.invalidateQueries({
          queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
        });
      }

      toast.success(successMessage);
      setSelectedIds(new Set());
      setIsMultiSelect(false);
    },
    onError: () => {
      toast.error('An error occurred while deleting games');
    },
  });

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) {
      return;
    }

    deleteMutation.mutate(Array.from(selectedIds));
    setIsDeleteDialogOpen(false);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const toggleMultiSelect = () => {
    setIsMultiSelect((prev) => {
      const next = !prev;
      if (!next) {
        clearSelection();
      }
      return next;
    });
  };

  return {
    isMultiSelect,
    setIsMultiSelect,
    toggleMultiSelect,
    selectedIds,
    setSelectedIds,
    toggleSelect,
    clearSelection,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    handleBulkDelete,
    deleteMutation,
    isPending: deleteMutation.isPending,
    locationName,
  };
}

export type UseBulkDeleteReturn = ReturnType<typeof useBulkDelete>;
