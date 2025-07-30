import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ClearCart } from '../redux/cartSlice';

const OrderPage = () => {
  const cartItems = useSelector((state) => state.cart);
  const dispatch = useDispatch();

  // Fixed shop details
  const shopDetails = {
    shopName: 'A1 Kirana Store',
    gstNumber: '09ABCDE1234Z5X'
  };

  const [customerDetails, setCustomerDetails] = useState({
    address: '',
    mobile: '',
    deliveryType: 'homedelivery',
  });

  const handleChange = (e) => {
    setCustomerDetails({ ...customerDetails, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = () => {
    const order = {
      ...shopDetails,
      items: cartItems,
      ...customerDetails,
      totalAmount: calculateTotal(),
    };

    console.log('Order Saved:', order);
    dispatch(ClearCart());
    alert('Order placed successfully!');
  };

  const calculateTotal = () => {
    const subtotal = cartItems.reduce((acc, item) => acc + item.qty * item.price, 0);
    const tax = subtotal * 0.05;
    const deliveryFee = customerDetails.deliveryType === 'homedelivery' ? 50 : 0;
    return subtotal + tax + deliveryFee;
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Customer Details</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <input
          type="text"
          name="address"
          placeholder="Customer Address"
          className="p-2 border rounded"
          onChange={handleChange}
          value={customerDetails.address}
        />
        <input
          type="text"
          name="mobile"
          placeholder="Mobile Number"
          className="p-2 border rounded"
          onChange={handleChange}
          value={customerDetails.mobile}
        />
        <select
          name="deliveryType"
          className="p-2 border rounded"
          onChange={handleChange}
          value={customerDetails.deliveryType}
        >
          <option value="homedelivery">Home Delivery</option>
          <option value="pickup">Pickup</option>
        </select>
      </div>

      <h3 className="text-xl font-semibold mb-2">Order Summary</h3>
      <p><strong>Shop:</strong> {shopDetails.shopName}</p>
      <p><strong>GST No:</strong> {shopDetails.gstNumber}</p>

      <ul className="my-4">
        {cartItems.map((item) => (
          <li key={item.id}>
            {item.name} × {item.qty} = ₹{item.qty * item.price}
          </li>
        ))}
      </ul>

      <p>Tax (5%): ₹{(cartItems.reduce((acc, item) => acc + item.qty * item.price, 0) * 0.05).toFixed(2)}</p>
      {customerDetails.deliveryType === 'homedelivery' && <p>Delivery Fee: ₹50</p>}
      <p className="font-bold text-lg mt-2">Total: ₹{calculateTotal().toFixed(2)}</p>

      <button
        onClick={handlePlaceOrder}
        className="mt-6 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Place Order
      </button>
    </div>
  );
};

export default OrderPage;
