import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "cart",
  initialState: [],
  reducers: {
    AddItem: (state, action) => {
      const existItem = state.find((item) => item.id === action.payload.id);
      if (existItem) {
        // Agar item already hai to qty increase karo
        return state.map((item) =>
          item.id === action.payload.id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      } else {
        // Naya item add karo with qty = 1
        state.push({ ...action.payload, qty: 1 });
      }
    },

    RemoveItem: (state, action) => {
      return state.filter((item) => item.id !== action.payload);
    },

    IncrementQty: (state, action) => {
      return state.map((item) =>
        item.id === action.payload
          ? { ...item, qty: item.qty + 1 }
          : item
      );
    },

    DecrementQty: (state, action) => {
      return state.map((item) =>
        item.id === action.payload
          ? { ...item, qty: Math.max(item.qty - 1, 1) }
          : item
      );
    },

    ClearCart: () => {
      return [];
    }
  }
});

export const {
  AddItem,
  RemoveItem,
  IncrementQty,
  DecrementQty,
  ClearCart
} = cartSlice.actions;

export default cartSlice.reducer;
