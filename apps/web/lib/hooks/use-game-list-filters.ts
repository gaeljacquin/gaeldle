'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { useSelector } from '@tanstack/react-store';
import { type NumericString } from '@workspace/shared';
import {
  type SortOption,
  type SortField,
  type SortDir,
  sortOptions,
  pageSizes,
  type GameListStore,
} from '@/lib/stores/game-list-store';

export interface GameListFilterFormValues {
  search: string;
  searchIgdbId: string;
  sortOption: SortOption;
  pageSize: NumericString;
  page: number;
}

export interface UseGameListFiltersOptions<TFilter extends string = string> {
  store: GameListStore;
  filterOptions?: {
    default: TFilter;
    validValues?: readonly TFilter[];
  };
}

export function parseSortOption(sortOption: SortOption): {
  sortBy: SortField;
  sortDir: SortDir;
} {
  const [sortBy, sortDir] = sortOption.split('-') as [SortField, SortDir];

  return { sortBy, sortDir };
}

export function useGameListFilters<TFilter extends string = string>({
  store,
  filterOptions,
}: UseGameListFiltersOptions<TFilter>) {
  const { sortOption, setSortOption, pageSize, setPageSize } = store;

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const urlSearch = searchParams.get('search') ?? '';
  const urlSearchIgdbId = searchParams.get('searchIgdbId') ?? '';
  const urlSortOption = searchParams.get('sortOption') ?? '';
  const urlPageSize = searchParams.get('pageSize') ?? '';
  const urlFilter = searchParams.get('filter') as TFilter | null;
  const urlPage = searchParams.get('page')
    ? Number(searchParams.get('page'))
    : NaN;

  const defaultSearch = urlSearch;
  const defaultSearchIgdbId = urlSearchIgdbId;
  const defaultSortOption =
    urlSortOption && sortOptions.some((opt) => opt.value === urlSortOption)
      ? (urlSortOption as SortOption)
      : sortOption;
  const defaultPageSize =
    urlPageSize && pageSizes.includes(urlPageSize as NumericString)
      ? (urlPageSize as NumericString)
      : pageSize;
  const defaultPage = !isNaN(urlPage) && urlPage > 0 ? urlPage : 1;

  const filter: TFilter = filterOptions
    ? urlFilter &&
      (!filterOptions.validValues ||
        filterOptions.validValues.includes(urlFilter))
      ? urlFilter
      : filterOptions.default
    : (undefined as unknown as TFilter);

  const form = useForm({
    defaultValues: {
      search: defaultSearch,
      searchIgdbId: defaultSearchIgdbId,
      sortOption: defaultSortOption,
      pageSize: defaultPageSize,
      page: defaultPage,
    },
  });

  const formValues = useSelector(form.store, (state) => state.values);

  // Sync form values back to the zustand store when they change
  useEffect(() => {
    setSortOption(formValues.sortOption);
  }, [formValues.sortOption, setSortOption]);

  useEffect(() => {
    setPageSize(formValues.pageSize);
  }, [formValues.pageSize, setPageSize]);

  const [debouncedSearch, setDebouncedSearch] = useState(defaultSearch);
  const [debouncedSearchIgdbId, setDebouncedSearchIgdbId] =
    useState(defaultSearchIgdbId);
  const skipDebounceSearchRef = useRef(false);
  const skipDebounceSearchIgdbIdRef = useRef(false);

  const debouncedSearchRef = useRef(debouncedSearch);
  useEffect(() => {
    debouncedSearchRef.current = debouncedSearch;
  }, [debouncedSearch]);

  const debouncedSearchIgdbIdRef = useRef(debouncedSearchIgdbId);
  useEffect(() => {
    debouncedSearchIgdbIdRef.current = debouncedSearchIgdbId;
  }, [debouncedSearchIgdbId]);

  // On mount, if the URL is empty or missing parameters, sync the store values to the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let changed = false;

    if (!params.has('sortOption')) {
      params.set('sortOption', sortOption);
      changed = true;
    }

    if (!params.has('pageSize')) {
      params.set('pageSize', pageSize);
      changed = true;
    }

    if (!params.has('page')) {
      params.set('page', '1');
      changed = true;
    }

    if (changed) {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentSearchRef = useRef(defaultSearch);
  const currentSearchIgdbIdRef = useRef(defaultSearchIgdbId);

  // Sync refs inside an effect to avoid reading/writing refs during render
  useEffect(() => {
    currentSearchRef.current = formValues.search;
    currentSearchIgdbIdRef.current = formValues.searchIgdbId;
  }, [formValues.search, formValues.searchIgdbId]);

  const currentSortOption = formValues.sortOption;
  const currentPageSize = formValues.pageSize;
  const currentPage = formValues.page;

  const isDebouncing =
    formValues.search !== debouncedSearch ||
    formValues.searchIgdbId !== debouncedSearchIgdbId;

  // Sync URL params -> Form state (handles back/forward navigation)
  useEffect(() => {
    const uSearch = searchParams.get('search') ?? '';
    const uSearchIgdbId = searchParams.get('searchIgdbId') ?? '';
    const uSortOption = searchParams.get('sortOption') ?? '';
    const uPageSize = searchParams.get('pageSize') ?? '';
    const uPageStr = searchParams.get('page');
    const uPage = uPageStr ? Number(uPageStr) : NaN;

    let searchChanged = false;
    let searchIgdbIdChanged = false;

    if (currentSearchRef.current !== uSearch) {
      form.setFieldValue('search', uSearch);
      searchChanged = true;
    }

    if (currentSearchIgdbIdRef.current !== uSearchIgdbId) {
      form.setFieldValue('searchIgdbId', uSearchIgdbId);
      searchIgdbIdChanged = true;
    }

    if (uSortOption && sortOptions.some((opt) => opt.value === uSortOption)) {
      if (currentSortOption !== uSortOption) {
        form.setFieldValue('sortOption', uSortOption as SortOption);
      }
    }

    if (uPageSize && pageSizes.includes(uPageSize as NumericString)) {
      if (currentPageSize !== uPageSize) {
        form.setFieldValue('pageSize', uPageSize as NumericString);
      }
    }

    if (!isNaN(uPage) && uPage > 0) {
      if (currentPage !== uPage) {
        form.setFieldValue('page', uPage);
      }
    } else if (uPageStr === null) {
      if (currentPage !== 1) {
        form.setFieldValue('page', 1);
      }
    }

    if (searchChanged) {
      skipDebounceSearchRef.current = true;
      setDebouncedSearch(uSearch);
    }
    if (searchIgdbIdChanged) {
      skipDebounceSearchIgdbIdRef.current = true;
      setDebouncedSearchIgdbId(uSearchIgdbId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, form]);

  // Sync state -> URL parameters
  useEffect(() => {
    if (isDebouncing) {
      return;
    }

    const params = new URLSearchParams(window.location.search);

    if (debouncedSearch) {
      params.set('search', debouncedSearch);
    } else {
      params.delete('search');
    }

    if (debouncedSearchIgdbId) {
      params.set('searchIgdbId', debouncedSearchIgdbId);
    } else {
      params.delete('searchIgdbId');
    }

    if (filterOptions && filter !== undefined) {
      if (filter !== filterOptions.default) {
        params.set('filter', filter);
      } else {
        params.delete('filter');
      }
    }

    params.set('sortOption', formValues.sortOption);
    params.set('pageSize', formValues.pageSize);
    params.set('page', String(formValues.page));

    const newSearch = params.toString();
    const currentSearch = window.location.search.replace(/^\?/, '');

    if (newSearch !== currentSearch) {
      router.replace(`${pathname}?${newSearch}`, { scroll: false });
    }
  }, [
    debouncedSearch,
    debouncedSearchIgdbId,
    formValues.sortOption,
    formValues.pageSize,
    formValues.page,
    filter,
    filterOptions,
    isDebouncing,
    pathname,
    router,
  ]);

  // Debounce search value with bypass
  useEffect(() => {
    if (skipDebounceSearchRef.current) {
      skipDebounceSearchRef.current = false;
      setDebouncedSearch(formValues.search);

      return;
    }

    const handler = setTimeout(() => {
      if (formValues.search !== debouncedSearchRef.current) {
        form.setFieldValue('page', 1);
        setDebouncedSearch(formValues.search);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [formValues.search, form]);

  // Debounce searchIgdbId value with bypass
  useEffect(() => {
    if (skipDebounceSearchIgdbIdRef.current) {
      skipDebounceSearchIgdbIdRef.current = false;
      setDebouncedSearchIgdbId(formValues.searchIgdbId);

      return;
    }

    const handler = setTimeout(() => {
      if (formValues.searchIgdbId !== debouncedSearchIgdbIdRef.current) {
        form.setFieldValue('page', 1);
        setDebouncedSearchIgdbId(formValues.searchIgdbId);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [formValues.searchIgdbId, form]);

  const { sortBy, sortDir } = parseSortOption(formValues.sortOption);

  const setFilter = useCallback(
    (newFilter: TFilter) => {
      form.setFieldValue('page', 1);
      const params = new URLSearchParams(window.location.search);
      if (filterOptions && newFilter !== filterOptions.default) {
        params.set('filter', newFilter);
      } else {
        params.delete('filter');
      }
      params.set('page', '1');
      const newSearch = params.toString();
      router.replace(newSearch ? `${pathname}?${newSearch}` : pathname, {
        scroll: false,
      });
    },
    [form, filterOptions, router, pathname],
  );

  const clearSearch = useCallback(() => {
    skipDebounceSearchRef.current = true;
    skipDebounceSearchIgdbIdRef.current = true;
    form.setFieldValue('search', '');
    form.setFieldValue('searchIgdbId', '');
    form.setFieldValue('page', 1);

    if (filterOptions) {
      const params = new URLSearchParams(window.location.search);
      params.delete('search');
      params.delete('searchIgdbId');
      params.delete('filter');
      params.set('page', '1');
      const newSearch = params.toString();
      router.replace(newSearch ? `${pathname}?${newSearch}` : pathname, {
        scroll: false,
      });
    }
  }, [form, filterOptions, router, pathname]);

  return {
    form,
    formValues,
    filter,
    setFilter,
    debouncedSearch,
    debouncedSearchIgdbId,
    skipDebounceSearchRef,
    skipDebounceSearchIgdbIdRef,
    isDebouncing,
    sortBy,
    sortDir,
    clearSearch,
    searchParams,
  };
}

export type UseGameListFiltersReturn<TFilter extends string = string> =
  ReturnType<typeof useGameListFilters<TFilter>>;
