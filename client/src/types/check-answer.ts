export type CheckAnswerType<T extends unknown> = (
  answer: boolean,
  ...optionalArgs: T[]
) => void;
