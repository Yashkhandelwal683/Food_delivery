import React from 'react';


/**
 * Validates customer details based on strict rules.
 * This function should ideally be used in the parent component 
 * before placing the order to stop invalid submission.
 * @param {object} details - Customer details {name, mobile, address}
 * @param {string} deliveryType - 'homedelivery' or 'pickup'
 * @returns {object} Errors object, empty if valid.
 */
const validateCustomerDetails = (details, deliveryType) => {
    const errors = {};

    // 1. Name Validation: Must be at least 5 words, letters/spaces only.
    const name = details.name ? details.name.trim() : '';
    const nameWordCount = name.split(/\s+/).filter(word => word.length > 0).length;
    // Regex allows letters, spaces, but nothing else.
    const specialCharRegex = /[^a-zA-Z\s]/; 

    if (!name) {
        errors.name = "Customer Name is required.";
    } else {
        if (specialCharRegex.test(name)) {
            errors.name = "Name should only contain letters and spaces (no special characters or numbers).";
        }
        // Check word count only if no major special char error blocked it
        if (!errors.name && nameWordCount < 5) {
            errors.name = "Name must contain at least 5 words.";
        }
    }


    // 2. Mobile Validation: Must be exactly 10 digits and numbers only.
    const mobile = details.mobile ? String(details.mobile).trim() : '';
    // Regex for exactly 10 digits.
    const mobileRegex = /^\d{10}$/; 

    if (!mobileRegex.test(mobile)) {
        errors.mobile = "Mobile number must be a 10-digit number (no special characters).";
    }

    // 3. Address Validation (Conditional for Home Delivery): Must be specific (min 10 chars).
    if (deliveryType === 'homedelivery') {
        const address = details.address ? details.address.trim() : '';
        if (address.length < 10) {
            errors.address = "Address is required and must be specific (minimum 10 characters).";
        }
    }

    return errors;
};


// =============================================================
// CART BILL SUMMARY COMPONENT
// =============================================================

const CartBillSummary = ({ cartItems, deliveryType, customerDetails, shopDetails }) => {
  const subtotal = cartItems.reduce((acc, item) => acc + item.qty * item.price, 0);
  // NOTE: Tax is hardcoded to 0 here as in original code.
  const tax = 0; 
  const deliveryFee = deliveryType === 'homedelivery' ? 50 : 0;
  const total = subtotal + tax + deliveryFee;

  // Validation Check karke display karne ke liye
  let validationErrors = {};
  if (customerDetails) {
      // NOTE: Is component mein validation sirf display ke liye ho raha hai.
      // Order ko rokne ke liye, aapko yeh check 'Place Order' button wale function mein lagana hoga.
      validationErrors = validateCustomerDetails(customerDetails, deliveryType);
  }
  
  // Check if there are any errors to display
  const hasErrors = Object.keys(validationErrors).length > 0;

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
          
          {/* Display Errors if validation fails */}
          {hasErrors && (
              <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                  <p className="font-bold">⚠️ Customer Details Errors (Order Can't Proceed):</p>
                  {validationErrors.name && <p className="ml-2 text-xs"> - Name: {validationErrors.name}</p>}
                  {validationErrors.mobile && <p className="ml-2 text-xs"> - Mobile: {validationErrors.mobile}</p>}
                  {validationErrors.address && <p className="ml-2 text-xs"> - Address: {validationErrors.address}</p>}
              </div>
          )}
        </div>
      )}

      {/* Bill Summary */}
      <div className="text-right font-medium border-t pt-4">
        <p>Subtotal: ₹{subtotal.toFixed(2)}</p>
        <p>Tax (5%): ₹{tax.toFixed(2)}</p>
        <p>Delivery Fee: ₹{deliveryFee}</p>
        <p className="font-bold text-lg mt-2">Total: ₹{total.toFixed(2)}</p>
      </div>
    </div>
  );
};

export default CartBillSummary;