import { create } from "zustand";
// import createClassicUnlimitedSlice, {
//   ClassicUnlimitedSlice,
// } from "@/stores/classic-unlimited-slice";
import createModesSlice from "@/stores/modes-slice";

const useClassicUnlimitedStore = create((set, get) => ({
  // ...createClassicUnlimitedSlice(set, get as () => ClassicUnlimitedSlice),
  ...createModesSlice(get),
}));

export default useClassicUnlimitedStore;
