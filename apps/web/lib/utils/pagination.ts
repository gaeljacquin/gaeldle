export function calcTotalPages(
  total: number | undefined,
  pageSize: number | string,
): number {
  const size =
    typeof pageSize === 'string' ? Number.parseInt(pageSize, 10) : pageSize;

  return total && size > 0 ? Math.ceil(total / size) : 0;
}
