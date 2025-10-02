// src/components/CartItemCard.jsx
import React from 'react';
import { useDispatch } from 'react-redux';
import { incrementQty, decrementQty } from '../redux/cartSlice';



function CartItemCard({ name, qty, price, image, id }) {
  const dispatch = useDispatch();

  return (
    <div className="flex items-center gap-4 p-3 border rounded-md shadow-sm hover:shadow-md transition">
      <img
        src={image}
        alt={name}
        className="w-16 h-16 object-cover rounded"
      />
      <div className="flex-1 flex flex-col">
        <h4 className="font-semibold">{name}</h4>
        <p className="text-green-600 font-bold">₹{(price * qty).toFixed(2)}</p>
        <div className="flex items-center gap-2 mt-2">
          <button
            className="bg-red-400 text-white px-2 py-1 rounded-full"
            onClick={() => dispatch(decrementQty(id))}
          >
            -
          </button>
          <span className="text-lg font-semibold">{qty}</span>
          <button
            className="bg-green-500 text-white px-2 py-1 rounded-full"
            onClick={() => dispatch(incrementQty(id))}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartItemCard;
