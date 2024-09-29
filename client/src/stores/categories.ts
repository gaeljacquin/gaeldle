import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { Category } from "@/types/categories";
import { ZCategories } from "@/types/zcategories";
import { absoluteUrl } from "@/lib/client-constants";

export const initialSate = {
  categories: [],
};

const zCategories = create(
  persist(
    devtools<ZCategories>((set, get) => ({
      ...initialSate,
      setCategories: async () => {
        const endpoint = "/api/categories";
        const res = await fetch(endpoint);
        const categories = await res.json();
        set({ categories });
      },
      getCategory: (categoryId: number) => {
        const categories = get().categories;
        const category = categories.find(
          (val: Category) => val.id === categoryId
        );

        return category;
      },
    })),
    { name: "zcategories" }
  )
);

zCategories.getState().setCategories();

export default zCategories;
