'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteBulkGames,
  updateBulkGamesHidden,
} from '@/lib/services/game.service';
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
  const [isSetHiddenDialogOpen, setIsSetHiddenDialogOpen] = useState(false);
  const [isUnsetHiddenDialogOpen, setIsUnsetHiddenDialogOpen] = useState(false);

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

  const setHiddenMutation = useMutation({
    mutationFn: ({ ids, hidden }: { ids: number[]; hidden: boolean }) =>
      updateBulkGamesHidden(ids, hidden),
    onSuccess: (_, variables) => {
      const count = selectedIds.size;
      const actionText = variables.hidden ? 'set as hidden' : 'unset as hidden';
      const successMessage = `${count} ${count === 1 ? entityName : `${entityName}s`} ${actionText} successfully`;

      for (const queryKey of queryKeysToInvalidate) {
        queryClient.invalidateQueries({
          queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
        });
      }

      toast.success(successMessage);
      setSelectedIds(new Set());
      setIsMultiSelect(false);
    },
    onError: (_, variables) => {
      const actionText = variables.hidden ? 'setting' : 'unsetting';
      toast.error(`An error occurred while ${actionText} games as hidden`);
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

  const handleBulkSetHidden = (hidden: boolean) => {
    if (selectedIds.size === 0) {
      return;
    }

    setHiddenMutation.mutate({ ids: Array.from(selectedIds), hidden });
    if (hidden) {
      setIsSetHiddenDialogOpen(false);
    } else {
      setIsUnsetHiddenDialogOpen(false);
    }
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
    isSetHiddenDialogOpen,
    setIsSetHiddenDialogOpen,
    isUnsetHiddenDialogOpen,
    setIsUnsetHiddenDialogOpen,
    handleBulkSetHidden,
    setHiddenMutation,
    isPending: deleteMutation.isPending || setHiddenMutation.isPending,
    locationName,
  };
}

export type UseBulkDeleteReturn = ReturnType<typeof useBulkDelete>;
export const useBulkGameActions = useBulkDelete;
export type UseBulkGameActionsReturn = UseBulkDeleteReturn;
