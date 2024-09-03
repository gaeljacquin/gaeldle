export default function keyNameByEnv(key: string) {
  if (
    process.env.NODE_ENV === 'dev' ||
    process.env.NODE_ENV === 'development'
  ) {
    key += '_dev';
  }

  return key;
}
