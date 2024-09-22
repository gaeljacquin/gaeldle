export default async function getIt(slug: string) {
  const res = await fetch(`/api/${slug}`);

  return res;
}
