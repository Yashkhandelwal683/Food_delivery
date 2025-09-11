import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ClearCart, incrementQty, decrementQty } from '../redux/cartSlice';
import { toast } from 'react-toastify';

const OrderPage = () => {
  const cartItems = useSelector((state) => state.cart.items);
  const dispatch = useDispatch();

  const shopDetails = {
    shopName: 'KHANDELWAL HOTEL AND RESTAURANT',
    gstNumber: '09ABCDE1234Z5X',
    phoneNumber: '+91 7500752265',
  };



  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    mobile: '',
    address: '',
    deliveryType: 'homedelivery',
  });

  const handleChange = (e) => {
    setCustomerDetails({ ...customerDetails, [e.target.name]: e.target.value });
  };

  const calculateTotal = () => {
    const subtotal = cartItems.reduce((acc, item) => acc + item.qty * item.price, 0);
    const tax = subtotal * 0.05;
    const deliveryFee = customerDetails.deliveryType === 'homedelivery' ? 50 : 0;
    const total = subtotal + tax + deliveryFee;

    return {
      subtotal,
      tax,
      deliveryFee,
      total,
    };
  };

  const handlePlaceOrder = () => {
    if (!customerDetails.name || !customerDetails.mobile || (customerDetails.deliveryType === 'homedelivery' && !customerDetails.address)) {
      toast.error("Please fill all customer details.");
      return;
    }

    const totals = calculateTotal();

    const order = {
      ...shopDetails,
      ...customerDetails,
      items: cartItems,
      subtotal: totals.subtotal,
      tax: totals.tax,
      deliveryFee: totals.deliveryFee,
      totalAmount: totals.total,
    };

    console.log('Order Placed:', order);
    toast.success("Order placed successfully!");
    dispatch(ClearCart());
  };

  const totals = calculateTotal();

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="text-center mb-6 text-red-600">
        <h1 className="text-3xl font-extrabold uppercase tracking-wide">{shopDetails.shopName}</h1>
        <p className="text-sm font-medium">GST No: {shopDetails.gstNumber}</p>
        <p className="text-sm font-medium">Phone: {shopDetails.phoneNumber}</p>
      </div>

      <h2 className="text-2xl font-bold mb-4">Customer Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <input type="text" name="name" placeholder="Customer Name" className="p-2 border rounded" onChange={handleChange} value={customerDetails.name} />
        <input type="text" name="mobile" placeholder="Mobile Number" className="p-2 border rounded" onChange={handleChange} value={customerDetails.mobile} />
        <select name="deliveryType" className="p-2 border rounded" onChange={handleChange} value={customerDetails.deliveryType}>
          <option value="homedelivery">Home Delivery</option>
          <option value="pickup">Pickup</option>
        </select>
        {customerDetails.deliveryType === 'homedelivery' && (
          <input type="text" name="address" placeholder="Delivery Address" className="p-2 border rounded col-span-1 md:col-span-2" onChange={handleChange} value={customerDetails.address} />
        )}
      </div>

      <h3 className="text-xl font-semibold mb-2">Order Summary</h3>
      {cartItems.length === 0 ? (
        <p className="text-red-500 font-medium">No items in cart.</p>
      ) : (
        <div className="max-h-96 overflow-y-auto pr-2">
          <ul className="my-4 space-y-2">
            {cartItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between border-b pb-2">
                <span className="font-medium">{item.name}</span>
                <div className="flex items-center gap-2">
                  <button className="px-2 py-1 bg-red-500 text-white rounded" onClick={() => dispatch(DecreaseQty(item.id))}>–</button>
                  <span>{item.qty}</span>
                  <button className="px-2 py-1 bg-green-500 text-white rounded" onClick={() => dispatch(IncreaseQty(item.id))}>+</button>
                </div>
                <span>= ₹{(item.qty * item.price).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {cartItems.length > 0 && (
        <div className="mt-4 space-y-1 text-right font-medium">
          <p>Subtotal: ₹{totals.subtotal.toFixed(2)}</p>
          <p>Tax (5%): ₹{totals.tax.toFixed(2)}</p>
          <p>Delivery Fee: ₹{totals.deliveryFee}</p>
          <p className="font-bold text-lg mt-2">Total: ₹{totals.total.toFixed(2)}</p>
        </div>
      )}

      <button onClick={handlePlaceOrder} className="mt-6 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50" disabled={cartItems.length === 0}>
        Place Order
      </button>
    </div>
  );
};

export default OrderPage;
