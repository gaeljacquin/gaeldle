export async function getMode(modeId: number) {
  const mode = await fetch(`${process.env.CLIENT_URL}/api/modes/${modeId}`);

  return await mode.json();
}
