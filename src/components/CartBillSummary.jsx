import React from 'react';

const CartBillSummary = ({ cartItems, deliveryType, customerDetails, shopDetails }) => {
  const subtotal = cartItems.reduce((acc, item) => acc + item.qty * item.price, 0);
  const tax = 0; 
  const deliveryFee = deliveryType === 'homedelivery' ? 50 : 0;
  const total = subtotal + tax + deliveryFee;

  return (
    <div className="mt-4 space-y-4 border-t pt-4 text-sm bg-white p-4 rounded shadow">
      {/* Shop Info */}
      {shopDetails && (
        <div>
          <h3 className="text-base font-semibold">{shopDetails.shopName}</h3>
          <p>GST No: {shopDetails.gstNumber}</p>
          <p>Phone: {shopDetails.phoneNumber}</p>
        </div>
      )}

      {/* Customer Info */}
      {customerDetails && (
        <div className="border-t pt-3">
          <p><strong>Customer:</strong> {customerDetails.name}</p>
          <p><strong>Mobile:</strong> {customerDetails.mobile}</p>
          {deliveryType === 'homedelivery' && (
            <p><strong>Address:</strong> {customerDetails.address}</p>
          )}
          <p><strong>Delivery Type:</strong> {deliveryType === 'homedelivery' ? 'Home Delivery' : 'Pickup'}</p>
        </div>
      )}

      {/* Bill Summary */}
      <div className="text-right font-medium border-t pt-4">
        <p>Subtotal: ₹{subtotal.toFixed(2)}</p>
        {/* <p>Tax (5%): ₹{tax.toFixed(2)}</p> */}
        <p>Delivery Fee: ₹{deliveryFee}</p>
        <p className="font-bold text-lg mt-2">Total: ₹{total.toFixed(2)}</p>
      </div>
    </div>
  );
};

export default CartBillSummary;
