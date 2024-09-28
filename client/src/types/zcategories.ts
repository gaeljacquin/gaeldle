import { Category, Categories } from "@/types/categories";

export type ZCategories = {
  categories: Categories;
  setCategories: () => void;
  getCategory: (arg0: number) => Category | undefined;
};
