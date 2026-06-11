export type NumericString = `${number}`;

type Primitive = string | number | boolean;

export type DotPaths<T, Prefix extends string = ''> = T extends
  | Primitive
  | null
  | undefined
  ? never
  : T extends Array<infer Item>
    ? DotPaths<Item, Prefix>
    : {
        [K in keyof T & string]:
          | `${Prefix}${K}`
          | DotPaths<T[K], `${Prefix}${K}.`>;
      }[keyof T & string];
