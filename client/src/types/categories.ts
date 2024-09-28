export type Category = {
  id: number;
  type: string;
  label: string;
  _count: { [key: string]: number };
};

export type Categories = Category[];
