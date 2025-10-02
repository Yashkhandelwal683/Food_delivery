import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux"; // useSelector removed as it's not used directly
import { toast } from "react-toastify";
import { ClearCart } from "../redux/cartSlice";

// Define the available cashier names
const CASHIER_NAMES = ["Yash", "Manish", "Gauri"];

// Custom CSS to hide number input spinners and other elements on print
const customStyles = `
  /* Hide the number input arrows for Chrome, Safari, Edge, Opera */
  input[type=number]::-webkit-inner-spin-button, 
  input[type=number]::-webkit-outer-spin-button { 
    -webkit-appearance: none;
    margin: 0;
  }

  /* Hide the number input arrows for Firefox */
  input[type=number] {
    -moz-appearance: textfield;
  }
  
  /* Show quantity, price, and cashier name as simple text on print */
  @media print {
    .print-only-text {
      display: block;
    }
    .print-hidden-input {
      display: none;
    }
    /* Hide the entire Manual Bill Discount type selector on screen and print */
    .discount-type-selector {
        display: none !important;
    }


    /* Table ke andar rows ko page break se bachaye */
    tr {
        page-break-inside: avoid;
    }
    
    /* Har 11th row se pehle naya page shuru kare (10n + 1 = 11, 21, 31, ...) */
    .bill-item-row:nth-child(10n + 1):not(:first-child) {
      page-break-before: always !important;
    }
    
    /* Table Header (thead) ko har naye page par repeat kare */
    thead {
        display: table-header-group;
    }
    .print-header-row {
        page-break-inside: avoid;
    }
  }

  @media screen {
    .print-only-text {
      display: none;
    }
    /* Hide the entire Manual Bill Discount type selector on screen */
    .discount-type-selector {
        display: none !important;
    }
  }
`;

function BillingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const order = location.state?.order;

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-red-500 text-xl">No order found!</h2>
        <button
          onClick={() => navigate("/")}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Back to Home
        </button>
      </div>
    );
  }

  // Bill Discount: Defaulting type to 'percentage'
  const [discountValue, setDiscountValue] = useState(order?.discount?.value || 0);
  const discountType = "percentage"; 
  
  // Cashier name state initialized with the first name from the list
  const [cashierName, setCashierName] = useState(CASHIER_NAMES[0]);

  // Item discount logic is removed from here
  const initialItems = (order.items || []).map(item => ({
      ...item,
      // itemDiscountValue: item.itemDiscountValue || 0, // Removed
      // itemDiscountType: item.itemDiscountType || 'flat', // Removed
  }));

  const [items, setItems] = useState(initialItems);
  
  const [newItem, setNewItem] = useState({ 
      name: '', 
      qty: 1, 
      price: 0,
      // itemDiscountValue: 0, // Removed
      // itemDiscountType: 'flat', // Removed
  });

  const inputRefs = {
    name: useRef(null),
    qty: useRef(null),
    price: useRef(null),
  };

  useEffect(() => {
    inputRefs.name.current?.focus();
  }, []);

  const handleInputChange = (e, index, field) => {
    const { value } = e.target;
    const newItems = [...items];
    
    // Only 'name' logic remains for string fields
    if (field === 'name') {
        newItems[index][field] = value;
    } else {
        newItems[index][field] = parseFloat(value) || 0;
    }
    setItems(newItems);
  };

  const handleNewItemChange = (e) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ 
        ...prev, 
        // Logic simplified as discount is removed
        [name]: (name === 'qty' || name === 'price') 
                ? parseFloat(value) || 0 
                : value 
    }));
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (newItem.name && newItem.qty > 0 && newItem.price > 0) {
      setItems(prevItems => [...prevItems, { ...newItem, id: Date.now() }]);
      setNewItem({ name: '', qty: 1, price: 0 }); // Discount fields removed
      inputRefs.name.current?.focus();
    } else {
      toast.error("Please fill all required details for new item (Name, Qty > 0, Price > 0).");
    }
  };

  const handleKeyDown = (e, nextInputRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextInputRef) {
        nextInputRef.current?.focus();
      } else {
        handleAddItem(e);
      }
    }
  };
  
  const handleViewBill = () => {
    window.print();
  };

  const handlePlaceOrder = () => {
    toast.success(`Order #${order.orderId || 'N/A'} placed successfully!`);
    dispatch(ClearCart());
    navigate("/");
  };
  
  // --- Calculation Logic (Simplified) ---
  
  // 1. Base Subtotal (Total of Qty * Price, now Total Before Discount)
  const totalBeforeDiscount = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  
  // 2. Total Item Discount Amount (No longer needed, set to 0)
  const totalItemDiscountAmount = 0;
  
  // 3. Subtotal After Item Discount (Same as totalBeforeDiscount)
  const subtotalAfterItemDiscount = totalBeforeDiscount;

  // 4. Calculate Manual Bill Discount (applied to totalBeforeDiscount)
  let manualDiscountAmount = 0;
  const parsedDiscountValue = parseFloat(discountValue) || 0;

  // Discount Type is fixed to percentage
  manualDiscountAmount = subtotalAfterItemDiscount * (parsedDiscountValue / 100);
  
  if (manualDiscountAmount > subtotalAfterItemDiscount) {
      manualDiscountAmount = subtotalAfterItemDiscount;
  }
  
  // 5. Total Discount (Only Manual Discount remains)
  const totalDiscount = manualDiscountAmount;
  
  // 6. Total Before GST (Total Before Discount - Manual Bill Discount)
  const totalBeforeGST = totalBeforeDiscount - manualDiscountAmount;
  
  // 7. Calculate GST (Applied to Total Before GST)
  const gstRate = 5;
  const totalGst = totalBeforeGST * (gstRate / 100);
  
  // 8. Total Before Round Off
  const totalBeforeRoundOff = totalBeforeGST + totalGst;
  
  // 9. Round Off Calculation (Always enabled)
  const roundedTotal = Math.round(totalBeforeRoundOff);
  const roundOffAmount = roundedTotal - totalBeforeRoundOff;

  // 10. Grand Total
  const grandTotal = roundedTotal;

  // --- Static Data ---
  const shop = {
    shopName: "KHANDELWAL RESTRO AND RESTAURANT",
    address: "KRISHNA NAGAR MATHURA",
    phoneNumber: "+91 7500752265",
    gstNumber: "09ABCDE1234Z5X",
    fssaiNo: "123456789012345",
    email: "khandelwwalrestro@gmail.com",
    state: "Uttar Pradesh",
    stateCode: "UP",
    panNumber: "ABCDE1234F"
  };

  // Customer data extraction
  const customer = {
    name: order.customer?.name || "Customer Name",
    address: order.customer?.address || "Customer Address",
    mobile: order.customer?.mobile || "N/A", // Fixed mobile display logic is here
    email: order.customer?.email || "",
  };

  const payment = order.payment || {
    method: "N/A",
  };
  
  const orderId = order.orderId || `ORD-${Date.now()}`;
  const invoiceDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  
  const amountToWords = (amount) => {
    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    
    const inWords = (num) => {
      if (num === 0) return '';
      if (num < 20) return a[num];
      if (num < 100) return b[Math.floor(num / 10)] + ' ' + a[num % 10];
      if (num < 1000) return a[Math.floor(num / 100)] + ' hundred ' + inWords(num % 100);
      if (num < 100000) return inWords(Math.floor(num / 1000)) + ' thousand ' + inWords(num % 1000);
      if (num < 10000000) return inWords(Math.floor(num / 100000)) + ' lakh ' + inWords(num % 100000);
      return inWords(Math.floor(num / 10000000)) + ' crore ' + inWords(Math.floor(num % 10000000));
    };

    const [rupees, paise] = grandTotal.toFixed(2).split('.').map(Number);
    let result = '';
    if (rupees > 0) {
      result += inWords(rupees).trim() + ' rupees';
    }
    
    if (paise > 0) {
      result += (result ? ' and ' : '') + inWords(paise).trim() + ' paise';
    } else {
      result += (result ? ' and ' : '') + 'zero paise';
    }
    if (result.startsWith('and')) {
      result = result.substring(4);
    }
    return result;
  };
  
  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'cod': return 'Cash on Delivery';
      case 'upi': return 'UPI';
      case 'paytm': return 'Paytm / PhonePe';
      case 'card': return 'Debit / Credit Card';
      case 'borrow': return 'After Paying';
      default: return 'N/A';
    }
  };

  // ⭐️ COLUMN COUNT ADJUSTMENT: 8 (old) to 7 (new: Item Discount removed)
  const totalColumns = 7;
  const summaryColSpan = totalColumns - 1; 
  const gstTextColSpan = 4; // 5 -> 4
  const gstAmountColSpan = 3; 

  return (
    <div className="p-4 max-w-4xl mx-auto bg-white border border-gray-400 font-sans text-xs print:shadow-none print:border-none">
      <style>{customStyles}</style>
      
      <form>
        <table className="w-full border-collapse">
          <thead>
            {/* ... Header and Shop Details ... */}
            <tr className="print-header-row">
                <td colSpan={totalColumns} className="p-1">
                    <div className="flex justify-between items-start text-xs print:text-[8px] print:leading-none">
                        <h2 className="font-bold">GST INVOICE</h2>
                        <h2 className="font-bold">(ORIGINAL FOR RECIPIENT)</h2>
                    </div>
                </td>
            </tr>
            <tr className="print-header-row">
                <td colSpan={totalColumns} className="p-0">
                    <div className="grid grid-cols-2 mt-2 border-t border-b border-gray-400">
                        <div className="border-r border-gray-400 p-2 leading-tight">
                            <p className="font-bold text-base print:text-sm">{shop.shopName}</p>
                            <p>{shop.address}</p>
                            <p>FSSAI NO. : {shop.fssaiNo}</p>
                            <p>GSTIN/UIN: {shop.gstNumber}</p>
                            <p>STATE Name: {shop.state}, Code: {shop.stateCode}</p>
                            <p>Contact: {shop.phoneNumber}</p>
                            <p>E-Mail: {shop.email}</p>
                        </div>
                        <div className="p-1">
                            <div className="grid grid-cols-[1fr_1fr] border-b border-gray-400">
                                <div className="p-1 border-r border-gray-400">
                                    <p>Invoice No.</p>
                                    <p className="font-bold">{orderId}</p>
                                </div>
                                <div className="p-1">
                                    <p>Dated</p>
                                    <p className="font-bold">{invoiceDate}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-[1fr_1fr] border-b border-gray-400">
                                <div className="p-1 border-r border-gray-400">
                                    <p>Cashier Name</p>
                                    <span className="print-only-text font-bold">{cashierName || "N/A"}</span>
                                    {/* Cashier Name Dropdown */}
                                    <select
                                        value={cashierName}
                                        onChange={(e) => setCashierName(e.target.value)}
                                        className="w-full border rounded p-1 text-xs print-hidden-input"
                                    >
                                        {CASHIER_NAMES.map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="p-1 bg-yellow-200">
                                    <p>Mode/Terms of Payment</p>
                                    <p className="font-bold">{getPaymentMethodText(payment.method)}</p>
                                </div>
                            </div>
                            <div className="p-2">
                                <p>Buyer (Bill to)</p>
                                <p className="font-bold">{customer.name}</p>
                                <p>{customer.address}</p>
                                <p>State Name: Uttar Pradesh, Code: 09</p>
                                <p>E-Mail: {customer.email || ""}</p>
                                {/* ⭐️ Contact number display fix: Now uses customer.mobile */}
                                <p>Contact: {customer.mobile}</p> 
                            </div>
                        </div>
                    </div>
                </td>
            </tr>

            {/* 3. Item Column Headers Row - Item Discount column removed */}
            <tr className="bg-gray-100 text-center">
              <th className="border-r border-b border-gray-400 w-[2%] p-1">Sl No</th>
              <th className="border-r border-b border-gray-400 w-[20%] p-1 text-left">Description of Goods</th>
              {/* 🚫 Removed: <th className="border-r border-b border-gray-400 w-[8%] p-1">Item Discount</th> */}
              <th className="border-r border-b border-gray-400 w-[5%] p-1">GST Rate</th>
              <th className="border-r border-b border-gray-400 w-[5%] p-1">Quantity</th>
              <th className="border-r border-b border-gray-400 w-[5%] p-1">Rate</th>
              <th className="border-r border-b border-gray-400 w-[5%] p-1">per</th>
              <th className="border-b border-gray-400 w-[10%] p-1">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
                return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-gray-50 bill-item-row"
                    >
                      <td className="border-r border-b border-gray-400 text-center p-1">{idx + 1}</td>
                      <td className="border-r border-b border-gray-400 px-2 p-1">{item.name}</td>
                      
                      {/* 🚫 Removed: Item Discount Column Content */}

                      <td className="border-r border-b border-gray-400 text-center p-1">{gstRate}%</td>
                      <td className="border-r border-b border-gray-400 text-center p-1">
                        <span className="print-only-text">{item.qty}</span>
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => handleInputChange(e, idx, 'qty')}
                          onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                          className="w-12 text-center border rounded p-1 print-hidden-input"
                          min="1"
                        />
                      </td>
                      <td className="border-r border-b border-gray-400 text-right pr-1 p-1">
                        <span className="print-only-text">₹{item.price.toFixed(2)}</span>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => handleInputChange(e, idx, 'price')}
                          onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                          className="w-16 text-right border rounded p-1 print-hidden-input"
                          min="0"
                        />
                      </td>
                      <td className="border-r border-b border-gray-400 text-center p-1">{item.unit || "pcs"}</td>
                      {/* Base amount (Qty * Price) */}
                      <td className="border-b border-gray-400 text-right pr-1 p-1">₹{(item.qty * item.price).toFixed(2)}</td>
                    </tr>
                );
            })}
            
            {/* New Item Row (Print Hidden) */}
            <tr className="print-hidden-input">
              <td className="border-r border-b border-gray-400 text-center p-1">{items.length + 1}</td>
              <td className="border-r border-b border-gray-400 px-2 p-1">
                <input
                  ref={inputRefs.name}
                  type="text"
                  name="name"
                  value={newItem.name}
                  onChange={handleNewItemChange}
                  onKeyDown={(e) => handleKeyDown(e, inputRefs.qty)}
                  className="w-full border rounded p-1 text-xs"
                  placeholder="Item Name"
                />
              </td>
              {/* 🚫 Removed: New Item Discount Column Content */}

              <td className="border-r border-b border-gray-400 text-center p-1">{gstRate}%</td>
              <td className="border-r border-b border-gray-400 text-center p-1">
                <input
                  ref={inputRefs.qty}
                  type="number"
                  name="qty"
                  value={newItem.qty}
                  onChange={handleNewItemChange}
                  onKeyDown={(e) => handleKeyDown(e, inputRefs.price)}
                  className="w-12 text-center border rounded p-1 text-xs"
                  min="1"
                />
              </td>
              <td className="border-r border-b border-gray-400 text-right pr-1 p-1">
                <input
                  ref={inputRefs.price}
                  type="number"
                  name="price"
                  value={newItem.price}
                  onChange={handleNewItemChange}
                  onKeyDown={(e) => handleKeyDown(e)}
                  className="w-16 text-right border rounded p-1 text-xs"
                  min="0"
                />
              </td>
              <td className="border-r border-b border-gray-400 text-center p-1">pcs</td>
              <td className="border-b border-gray-400 text-right pr-1 p-1">
                ₹{(newItem.qty * newItem.price).toFixed(2)}
              </td>
            </tr>
            
            {/* 1. Total (Base Subtotal) */}
            <tr>
              <td colSpan={summaryColSpan} className="text-right font-bold p-1">Total</td>
              <td className="border-b border-gray-400 text-right pr-1 p-1 font-bold">₹{totalBeforeDiscount.toFixed(2)}</td>
            </tr>
            
            {/* 2. Discount (Only Manual Bill Discount remains) */}
            <tr>
              {/* ColSpan adjusted from summaryColSpan - 2 to summaryColSpan - 1, and 2 columns merged to 1 */}
              <td colSpan={summaryColSpan - 1} className="text-right font-bold p-1 border-b border-gray-400">Discount</td>
              <td colSpan="1" className="text-right p-1 border-b border-gray-400 print:hidden">
                <div className="flex justify-end items-center space-x-2">
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="border p-1 w-20 text-xs rounded"
                    placeholder="e.g. 10"
                    min="0"
                  />
                  <span className="font-bold border p-1 text-xs rounded ml-1">%</span>
                </div>
              </td>
              <td colSpan="1" className="text-right pr-1 p-1 font-bold border-b border-gray-400 text-red-600">
                  - ₹{totalDiscount.toFixed(2)}
              </td>
            </tr>
            
            {/* 3. Total After Discount (Total Before GST) - ColSpan Adjusted */}
            <tr>
              <td colSpan={summaryColSpan} className="text-right font-bold p-1">Total After Discount</td>
              <td className="border-b border-gray-400 text-right pr-1 p-1 font-bold">₹{totalBeforeGST.toFixed(2)}</td>
            </tr>

            {/* GST (CGST/SGST) - ColSpan Adjusted */}
            <tr>
              <td colSpan={gstTextColSpan} className="border-t border-b border-r border-gray-400 p-1 text-left">
                <p>CGST ({gstRate / 2}%)</p>
                <p>SGST ({gstRate / 2}%)</p>
              </td>
              <td colSpan={gstAmountColSpan} className="border-t border-b border-gray-400 p-1 text-right">
                <p>₹{(totalGst / 2).toFixed(2)}</p>
                <p>₹{(totalGst / 2).toFixed(2)}</p>
              </td>
            </tr>
            
            {/* Round Off (Always applied) */}
            <tr>
                <td colSpan={summaryColSpan} className="text-right font-bold p-1">
                    Round Off
                </td>
                <td className="border-b border-gray-400 text-right pr-1 p-1 font-bold">
                    {roundOffAmount.toFixed(2)}
                </td>
            </tr>
          </tbody>
        </table>
      </form>
      
      {/* Grand Total Footer */}
      <div className="grid grid-cols-2 text-right border-t border-b border-gray-400">
        <div className="border-r border-gray-400 p-1 text-base">
          <p className="font-bold">Grand Total</p>
        </div>
        <div className="p-1 text-base">
          <p className="font-bold">₹{grandTotal.toFixed(2)}</p>
        </div>
      </div>
      
      {/* ... Other Footer Sections and Buttons ... */}
      <div className="p-1 border-t border-gray-400">
        <p><strong>Amount Chargeable (in words)</strong></p>
        <p className="font-bold">{amountToWords(grandTotal).toUpperCase()}</p>
        <div className="flex justify-between mt-2">
          <div>
            <p>Company's PAN</p>
            <p>Declaration:</p>
          </div>
          <div className="font-bold">
            <p>{shop.panNumber || "N/A"}</p>
          </div>
        </div>
        <div className="mt-2 text-[10px] italic">
          <p>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
        </div>
        <div className="mt-2 text-center text-[10px] flex justify-between items-end">
          <p className="italic">This is a Computer Generated Invoice</p>
          <div className="text-center">
            <p>For {shop.shopName}</p>
            <p className="mt-8 border-t border-black font-bold">Authorized Signatory</p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end mt-8 print:hidden space-x-4">
        <button
          onClick={handleViewBill}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          View Bill & Print
        </button>
        <button
          onClick={handlePlaceOrder}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Place Order
        </button>
      </div>
    </div>
  );
}

export default BillingPage;