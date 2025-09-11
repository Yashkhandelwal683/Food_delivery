import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, incrementQty, decrementQty } from '../redux/cartSlice';

function Card({ id, name, image, price, type }) {
  const dispatch = useDispatch();
  const cartItems = useSelector(state => state.cart.items);
  const itemInCart = cartItems.find(i => i.id === id);

  return (
    <div className="w-[250px] p-4 rounded-lg bg-white shadow-md hover:shadow-lg transition-all flex flex-col items-center">
      <img src={image} alt={name} className="w-full h-[150px] object-cover rounded-lg" />
      <h2 className="text-lg font-semibold mt-2">{name}</h2>
      <p className="text-green-500 font-bold">₹{price}</p>
      <p className="text-gray-500 text-sm">{type}</p>

      {itemInCart ? (
        <div className="flex items-center gap-3 mt-3">
          <button
            className="bg-red-400 text-white px-3 py-1 rounded-full"
            onClick={() => dispatch(decrementQty(id))}
          >
            -
          </button>
          <span className="text-lg font-semibold">{itemInCart.qty}</span>
          <button
            className="bg-green-500 text-white px-3 py-1 rounded-full"
            onClick={() => dispatch(incrementQty(id))}
          >
            +
          </button>
        </div>
      ) : (
        <button
          className="mt-3 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          onClick={() =>
            dispatch(addToCart({ id, name, image, price }))
          }
        >
          Add to Cart
        </button>
      )}
    </div>
  );
}

export default Card;
