export function timelineFormatDate(timestamp: number | null): string {
  if (!timestamp) {
    return '????-??-??'; // used to return 'Unknown' in the timeline dev toggle
  }

  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function extractReleaseYear(
  firstReleaseDate: number | null,
): string | null {
  if (!firstReleaseDate) {
    return null;
  }

  const date = new Date(firstReleaseDate * 1000);

  return date.getFullYear().toString();
}

export function extractArray(data: unknown): string[] {
  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    return data.map((item) => {
      if (typeof item === 'string') {
        return item;
      }

      if (typeof item === 'object' && item !== null && 'name' in item) {
        return (item as { name: string }).name;
      }

      return String(item);
    });
  }

  return [];
}

export function extractPublisher(involved_companies: unknown): string | null {
  if (!involved_companies || !Array.isArray(involved_companies)) {
    return null;
  }

  const publisher = involved_companies.find(
    (company: (typeof involved_companies)[number]) =>
      company?.publisher === true,
  );

  if (publisher && typeof publisher === 'object') {
    if ('company' in publisher) {
      const companyData = publisher.company;

      if (
        typeof companyData === 'object' &&
        companyData !== null &&
        'name' in companyData
      ) {
        return (companyData as { name: string }).name;
      }
    }

    if ('name' in publisher) {
      return (publisher as { name: string }).name;
    }
  }

  return null;
}
