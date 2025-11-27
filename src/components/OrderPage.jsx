import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ClearCart, incrementQty, decrementQty } from '../redux/cartSlice';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const validateCustomerDetails = (details) => {
    const errors = {};

  
    const name = details.name ? details.name.trim() : '';
    const nameWordCount = name.split(/\s+/).filter(word => word.length > 0).length;
 
    const specialCharRegex = /[^a-zA-Z\s]/; 

    if (!name) {
        errors.name = "Customer Name is required.";
    } else {
        if (specialCharRegex.test(name)) {
            errors.name = "Name should only contain letters and spaces (no special characters or numbers).";
        }
        if (!errors.name && nameWordCount < 5) {
            errors.name = "Name must contain at least 5 words.";
        }
    }

 
    const mobile = details.mobile ? String(details.mobile).trim() : '';
    const mobileRegex = /^\d{10}$/; // Exactly 10 digits

    if (!mobileRegex.test(mobile)) {
        errors.mobile = "Mobile number must be a 10-digit number (no special characters).";
    }

    // 3. Address Validation (Conditional for Home Delivery): Must be specific (min 10 chars).
    if (details.deliveryType === 'homedelivery') {
        const address = details.address ? details.address.trim() : '';
        if (address.length < 10) {
            errors.address = "Address is required and must be specific (minimum 10 characters).";
        }
    }

    return errors;
};

// =============================================================
// ORDER PAGE COMPONENT
// =============================================================

const OrderPage = () => {
  const cartItems = useSelector((state) => state.cart.items);
  const dispatch = useDispatch();
  const navigate = useNavigate();

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
  
  // State to hold and display validation errors in the form
  const [formErrors, setFormErrors] = useState({}); 

  const handleChange = (e) => {
    // Clear previous error for the field being changed
    setFormErrors(prev => ({ ...prev, [e.target.name]: undefined })); 
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

  // ⭐️ UPDATED PLACE ORDER FUNCTION WITH ENFORCED VALIDATION ⭐️
  const handlePlaceOrder = () => {
    if (cartItems.length === 0) {
      toast.error("Cart is empty. Please add items before placing an order.");
      return;
    }
    
    const errors = validateCustomerDetails(customerDetails);
    setFormErrors(errors); // Update state to display errors in the form

    // Check if there are any errors. If yes, stop the process.
    if (Object.keys(errors).length > 0) {
      toast.error("Please correct the customer details to proceed.");
      
      // Optionally show specific toast messages for the first few errors
      Object.values(errors).slice(0, 3).forEach(err => toast.error(`Error: ${err}`));

      return; // 🛑 VALIDATION ENFORCEMENT: Order stops here.
    }

    // --- Order Placement Logic (If validation passed) ---
    
    const totals = calculateTotal();
    
    const uniqueOrderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const order = {
      orderId: uniqueOrderId, 
      shop: shopDetails,
      customer: customerDetails,
      items: cartItems,
      subtotal: totals.subtotal,
      tax: totals.tax,
      deliveryFee: totals.deliveryFee,
      total: totals.total,
      payment: { method: "COD" },
      placedAt: new Date().toISOString(),
    };

    navigate("/billing", { state: { order } });
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
        
        {/* Customer Name Input */}
        <div>
            <input 
                type="text" 
                name="name" 
                placeholder="Customer Name (Min 5 words, No special chars)" 
                className={`p-2 border rounded w-full ${formErrors.name ? 'border-red-500' : 'border-gray-300'}`} 
                onChange={handleChange} 
                value={customerDetails.name} 
            />
            {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
        </div>

        {/* Mobile Number Input */}
        <div>
            <input 
                type="text" // Using text to show custom error, but number input is better for mobile keyboards
                name="mobile" 
                placeholder="Mobile Number (10 digits)" 
                className={`p-2 border rounded w-full ${formErrors.mobile ? 'border-red-500' : 'border-gray-300'}`} 
                onChange={handleChange} 
                value={customerDetails.mobile} 
                maxLength="10"
            />
            {formErrors.mobile && <p className="text-red-500 text-xs mt-1">{formErrors.mobile}</p>}
        </div>
        
        {/* Delivery Type Dropdown */}
        <select 
            name="deliveryType" 
            className="p-2 border rounded" 
            onChange={handleChange} 
            value={customerDetails.deliveryType}
        >
          <option value="homedelivery">Home Delivery</option>
          <option value="pickup">Pickup</option>
        </select>
        
        {/* Address Input (Conditional) */}
        {customerDetails.deliveryType === 'homedelivery' && (
          <div className="col-span-1 md:col-span-2">
            <input 
                type="text" 
                name="address" 
                placeholder="Delivery Address (Minimum 10 characters)" 
                className={`p-2 border rounded w-full ${formErrors.address ? 'border-red-500' : 'border-gray-300'}`} 
                onChange={handleChange} 
                value={customerDetails.address} 
            />
            {formErrors.address && <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>}
          </div>
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
                  <button className="px-2 py-1 bg-red-500 text-white rounded" onClick={() => dispatch(decrementQty(item.id))}>–</button>
                  <span>{item.qty}</span>
                  <button className="px-2 py-1 bg-green-500 text-white rounded" onClick={() => dispatch(incrementQty(item.id))}>+</button>
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