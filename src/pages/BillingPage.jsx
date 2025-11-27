import React, { useState, useRef, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { ClearCart } from "../redux/cartSlice";

// Define the available cashier names
const CASHIER_NAMES = ["Yash", "Manish", "Gauri"];

// --- Static Data ---
const shopData = {
  shopName: "KHANDELWAL RESTRO AND RESTAURANT",
  address: "KRISHNA NAGAR MATHURA",
  phoneNumber: "+91 7500752265,9027072232,8266844669",
  gstNumber: "09ABCDE1234Z5X",
  fssaiNo: "123456789012345",
  email: "khandelwalrestro@gmail.com",
  state: "Uttar Pradesh",
  stateCode: "UP",
  panNumber: "ABCDE1234F",
};

// Custom CSS to control printing and force page breaks
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

    /* ---------------------------------------------------- */
    /* Force the Delivery Slip onto a new page */
    .delivery-slip-page {
        page-break-before: always !important;
        margin-top: 0 !important; 
    }
    /* ---------------------------------------------------- */
    
    /* **UPDATED: Ensure Border is visible on Print** */
    .invoice-container, .delivery-slip-page {
        border: 1px solid #000000 !important; 
        box-shadow: none !important;
    }
    
    /* Hide delete button on print */
    .delete-button {
      display: none !important;
    }

    /* Title Swap for Invoice Print */
    .invoice-container .delivery-title {
        display: none !important;
    }
    .invoice-container .invoice-title {
        display: block !important;
    }
    
    /* Title Swap for Delivery Slip Print (Page 2) */
    .delivery-slip-page .invoice-title {
        display: none !important;
    }
    .delivery-slip-page .delivery-title {
        display: block !important;
    }
  }

  @media screen {
    .print-only-text {
      display: none;
    }
    /* Screen view should hide the print-only delivery title */
    .delivery-title {
      display: none;
    }
  }
`;

// Helper component for rendering the common item rows 
function ItemRows({ items, gstRate, handleInputChange, handleRemoveItem }) {
  return (
    <>
      {items.map((item, idx) => (
        <tr key={item.id} className="hover:bg-gray-50 bill-item-row">
          <td className="border-r border-b border-gray-400 text-center p-1">
            {idx + 1}
          </td>
          <td className="border-r border-b border-gray-400 px-2 p-1 summary-text-col">
            {item.name}
          </td>
          {/* GST Rate */}
          <td className="border-r border-b border-gray-400 text-center p-1">
            {gstRate}%
          </td>
          <td className="border-r border-b border-gray-400 text-center p-1">
            <span className="print-only-text">{item.qty}</span>
            <input
              type="number"
              value={item.qty}
              onChange={(e) => handleInputChange(e, idx, "qty")}
              onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
              className="w-12 text-center border rounded p-1 print-hidden-input"
              min="1"
            />
          </td>
          {/* Rate */}
          <td className="border-r border-b border-gray-400 text-right pr-1 p-1">
            <span className="print-only-text">
              ₹{item.price.toFixed(2)}
            </span>
            <input
              type="number"
              value={item.price}
              onChange={(e) => handleInputChange(e, idx, "price")}
              onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
              className="w-16 text-right border rounded p-1 print-hidden-input"
              min="0"
            />
          </td>
          {/* Per */}
          <td className="border-r border-b border-gray-400 text-center p-1">
            {item.unit || "pcs"}
          </td>
          {/* Amount */}
          <td className="border-b border-gray-400 text-right pr-1 p-1 relative">
            <div className="flex justify-between items-center">
              <span>₹{(item.qty * item.price).toFixed(2)}</span>
              {/* Added Delete Button (Hidden on Print) */}
              <button
                type="button"
                onClick={() => handleRemoveItem(idx)}
                className="ml-2 text-red-500 hover:text-red-700 font-bold delete-button print-hidden-input"
                title="Remove Item"
              >
                ❌
              </button>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}


// Helper component for rendering the Delivery Slip (Full Invoice structure)
function DeliverySlip({
  orderId,
  invoiceDate,
  customer,
  items,
  grandTotal,
  shop,
  getPaymentMethodText,
  payment,
  gstRate,
  handleInputChange,
  handleRemoveItem, 
  totalBeforeDiscount,
  totalDiscount,
  totalBeforeGST,
  totalGst,
  roundOffAmount,
  amountToWords,
  cashierName,
  setCashierName,
  discountValue,
  setDiscountValue,
  discountType,
  setDiscountType,
  CASHIER_NAMES,
  totalColumns,
  summaryColSpan,
  gstTextColSpan,
  gstAmountColSpan,
  inputRefs, 
  newItem,
  handleNewItemChange,
  handleKeyDown,
  handleAddItem,
}) {
  const isPercent = discountType === '%';

  return (
    // Tailwind classes border border-gray-400 applies for screen view
    <div className="p-4 max-w-4xl mx-auto bg-white border border-gray-400 font-sans text-xs print:shadow-none print:border-none delivery-slip-page mt-8">
      <form>
          <table className="w-full border-collapse">
            <thead>
              <tr className="print-header-row">
                <td colSpan={totalColumns} className="p-1">
                  <div className="flex justify-between items-start text-xs print:text-[8px] print:leading-none">
                    {/* Invoice Title (Hidden when printing slip) */}
                    <h2 className="font-bold invoice-title">GST INVOICE</h2>
                    {/* Delivery Title (Visible when printing slip) */}
                    <h2 className="font-bold delivery-title">DELIVERY CHALLAN</h2>
                  </div>
                </td>
              </tr>
              <tr className="print-header-row">
                <td colSpan={totalColumns} className="p-0">
                  <div className="grid grid-cols-2 mt-2 border-t border-b border-gray-400">
                    <div className="border-r border-gray-400 p-2 leading-tight">
                      <p className="font-bold text-base print:text-sm">
                        {shop.shopName}
                      </p>
                      <p>{shop.address}</p>
                      <p>FSSAI NO. : {shop.fssaiNo}</p>
                      <p>GSTIN/UIN: {shop.gstNumber}</p>
                      <p>
                        STATE Name: {shop.state}, Code: {shop.stateCode}
                      </p>
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
                          <span className="print-only-text font-bold">
                            {cashierName || "N/A"}
                          </span>

                          <select
                            value={cashierName}
                            onChange={(e) => setCashierName(e.target.value)}
                            className="w-full border rounded p-1 text-xs print-hidden-input"
                          >
                            {CASHIER_NAMES.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="p-1 bg-yellow-200">
                          <p>Mode/Terms of Payment</p>
                          <p className="font-bold">
                            {getPaymentMethodText(payment.method)}
                          </p>
                        </div>
                      </div>
                      <div className="p-2">
                        <p>Buyer (Bill to)</p>
                        <p className="font-bold">{customer.name}</p>
                        <p>{customer.address}</p>
                        <p>State Name: Uttar Pradesh, Code: 09</p>
                        <p>E-Mail: {customer.email || ""}</p>
                        <p>Contact: {customer.mobile}</p>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>

              {/* Table Headers (Full Invoice style) */}
              <tr className="bg-gray-100 text-center">
                <th className="border-r border-b border-gray-400 w-[2%] p-1">
                  Sl No
                </th>
                <th className="border-r border-b border-gray-400 w-[20%] p-1 text-left summary-text-col">
                  Description of Goods
                </th>
                <th className="border-r border-b border-gray-400 w-[5%] p-1">
                  GST Rate
                </th>
                <th className="border-r border-b border-gray-400 w-[5%] p-1">
                  Quantity
                </th>
                <th className="border-r border-b border-gray-400 w-[5%] p-1">
                  Rate
                </th>
                <th className="border-r border-b border-gray-400 w-[5%] p-1">
                  per
                </th>
                <th className="border-b border-gray-400 w-[10%] p-1">Amount</th>
              </tr>
            </thead>
            <tbody>
              {/* Item Rows - Renders all columns */}
              <ItemRows
                items={items}
                gstRate={gstRate}
                handleInputChange={handleInputChange}
                handleRemoveItem={handleRemoveItem}
              />

              {/* New Item Row (Print Hidden) */}
              <tr className="print-hidden-input">
                <td className="border-r border-b border-gray-400 text-center p-1">
                  {items.length + 1}
                </td>
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

                <td className="border-r border-b border-gray-400 text-center p-1">
                  {gstRate}%
                </td>
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
                <td className="border-r border-b border-gray-400 text-center p-1">
                  pcs
                </td>
                <td className="border-b border-gray-400 text-right pr-1 p-1">
                  ₹{(newItem.qty * newItem.price).toFixed(2)}
                </td>
              </tr>
              
              {/* --- Summary Rows (Full Invoice style) --- */}
              <tr>
                <td colSpan={summaryColSpan} className="text-right font-bold p-1">
                  Total
                </td>
                <td className="border-b border-gray-400 text-right pr-1 p-1 font-bold">
                  ₹{totalBeforeDiscount.toFixed(2)}
                </td>
              </tr>

              <tr>
                <td
                  colSpan={summaryColSpan - 1}
                  className="text-right font-bold p-1 border-b border-gray-400"
                >
                  Discount
                </td>
                <td
                  colSpan="1"
                  className="text-right p-1 border-b border-gray-400 print:hidden"
                >
                  <div className="flex justify-end items-center space-x-2">
                    {/* Discount Input */}
                    <input
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="border p-1 w-20 text-xs rounded"
                      placeholder="e.g. 10"
                      min="0"
                    />
                    {/* Discount Type Selector */}
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="border p-1 text-xs rounded font-bold"
                    >
                      <option value="%">%</option>
                      <option value="₹">₹</option>
                    </select>
                  </div>
                </td>
                <td
                  colSpan="1"
                  className="text-right pr-1 p-1 font-bold border-b border-gray-400 text-red-600"
                >
                  - ₹{totalDiscount.toFixed(2)}
                </td>
              </tr>

              <tr>
                <td colSpan={summaryColSpan} className="text-right font-bold p-1">
                  Total After Discount
                </td>
                <td className="border-b border-gray-400 text-right pr-1 p-1 font-bold">
                  ₹{totalBeforeGST.toFixed(2)}
                </td>
              </tr>

              <tr>
                <td
                  colSpan={gstTextColSpan}
                  className="border-t border-b border-r border-gray-400 p-1 text-left"
                >
                  <p>CGST ({gstRate / 2}%)</p>
                  <p>SGST ({gstRate / 2}%)</p>
                </td>
                <td
                  colSpan={gstAmountColSpan}
                  className="border-t border-b border-gray-400 p-1 text-right"
                >
                  <p>₹{(totalGst / 2).toFixed(2)}</p>
                  <p>₹{(totalGst / 2).toFixed(2)}</p>
                </td>
              </tr>

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

        {/* Grand Total Footer (Full Invoice style) */}
        <div className="grid grid-cols-2 text-right border-t border-b border-gray-400">
          <div className="border-r border-gray-400 p-1 text-base">
            <p className="font-bold">Grand Total</p>
          </div>
          <div className="p-1 text-base">
            <p className="font-bold">₹{grandTotal.toFixed(2)}</p>
          </div>
        </div>

        {/* Other Footer Sections and Buttons */}
        <div className="p-1 border-t border-gray-400">
          <p>
            <strong>Amount Chargeable (in words)</strong>
          </p>
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
          <div className="mt-2 text-[10px] bold italic">
            <p>
              We declare that this document shows the actual price of the goods
              described and that all particulars are true and correct.
            </p>
          </div>
          <div className="mt-2 text-center text-[10px] flex justify-between items-end">
            <p className="italic">This is a Computer Generated Document</p>
            <div className="text-center">
              <p>For {shop.shopName}</p>
              <p className="mt-8 border-t border-black font-bold">
                Authorized Signatory
              </p>
            </div>
          </div>
        </div>
      </div>
  );
}


// --- Main Component ---
function BillingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const order = location.state?.order;

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-red-500 text-xl box-border bottom-4">
          No order found!
        </h2>
        <button
          onClick={() => navigate("/")}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Back to Home
        </button>
      </div>
    );
  }

  // State initialization
  const [discountValue, setDiscountValue] = useState(
    order?.discount?.value || 0
  );
  // NEW: State for discount type
  const [discountType, setDiscountType] = useState('%'); // '%' or '₹'
  const [cashierName, setCashierName] = useState(CASHIER_NAMES[0]);

  const initialItems = (order.items || []).map((item) => ({
    ...item,
    id: item.id || Date.now() + Math.random(), // Ensure unique ID for key
  }));
  const [items, setItems] = useState(initialItems);

  const [newItem, setNewItem] = useState({
    name: "",
    qty: 1,
    price: 0,
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

    if (field === "name") {
      newItems[index][field] = value;
    } else {
      newItems[index][field] = parseFloat(value) || 0;
    }
    setItems(newItems);
  };
  
  // NEW: Function to remove an item
  const handleRemoveItem = (indexToRemove) => {
    setItems(prevItems => prevItems.filter((_, idx) => idx !== indexToRemove));
    toast.info("Item removed successfully.");
  };

  const handleNewItemChange = (e) => {
    const { name, value } = e.target;
    setNewItem((prev) => ({
      ...prev,
      [name]:
        name === "qty" || name === "price" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (newItem.name && newItem.qty > 0 && newItem.price > 0) {
      setItems((prevItems) => [...prevItems, { ...newItem, id: Date.now() + Math.random() }]);
      setNewItem({ name: "", qty: 1, price: 0 });
      inputRefs.name.current?.focus();
    } else {
      toast.error(
        "Please fill all required details for new item (Name, Qty > 0, Price > 0)."
      );
    }
  };

  const handleKeyDown = (e, nextInputRef) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (nextInputRef) {
        nextInputRef.current?.focus();
      } else {
        handleAddItem(e);
      }
    }
  };

  const handlePlaceOrder = () => {
    toast.success(`Order #${order.orderId || "N/A"} placed successfully!`);
    dispatch(ClearCart());
    navigate("/");
  };

  // --- CONSOLIDATED PRINT LOGIC ---
  const handleViewBill = () => {
    window.print();
  };
  // --------------------------------

  // --- Calculation Logic (Optimized with useMemo) ---
  const {
    gstRate,
    totalBeforeDiscount,
    totalDiscount,
    totalBeforeGST,
    totalGst,
    roundOffAmount,
    grandTotal,
  } = useMemo(() => {
    const gstRate = 5;
    const totalBeforeDiscount = items.reduce(
      (sum, item) => sum + item.qty * item.price,
      0
    );

    let manualDiscountAmount = 0;
    const parsedDiscountValue = parseFloat(discountValue) || 0;

    if (discountType === '%') {
        manualDiscountAmount = totalBeforeDiscount * (parsedDiscountValue / 100);
    } else { // Fixed amount (₹)
        manualDiscountAmount = parsedDiscountValue;
    }

    if (manualDiscountAmount > totalBeforeDiscount) {
      manualDiscountAmount = totalBeforeDiscount;
    }
    
    const totalDiscount = manualDiscountAmount;
    const totalBeforeGST = totalBeforeDiscount - manualDiscountAmount;
    const totalGst = totalBeforeGST * (gstRate / 100);
    const totalBeforeRoundOff = totalBeforeGST + totalGst;
    const roundedTotal = Math.round(totalBeforeRoundOff);
    const roundOffAmount = (roundedTotal - totalBeforeRoundOff).toFixed(2);
    const grandTotal = roundedTotal;

    return {
      gstRate,
      totalBeforeDiscount,
      totalDiscount,
      totalBeforeGST,
      totalGst,
      roundOffAmount: parseFloat(roundOffAmount),
      grandTotal,
    };
  }, [items, discountValue, discountType]);

  // --- Static Data and Helpers ---
  const shop = shopData;
  const customer = {
    name: order.customer?.name || "Customer Name",
    address: order.customer?.address || "Customer Address",
    mobile: order.customer?.mobile || order.customer?.phone || "N/A",
  };
  const payment = order.payment || {
    method: "N/A",
  };
  const orderId = order.orderId || `ORD-${Date.now()}`;
  const invoiceDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const getPaymentMethodText = (method) => {
    switch (method) {
      case "cod":
        return "Cash on Delivery";
      case "upi":
        return "UPI";
      case "paytm":
        return "Paytm / PhonePe";
      case "card":
        return "Debit / Credit Card";
      case "borrow":
        return "After Paying";
      default:
        return "N/A";
    }
  };

  const amountToWords = (amount) => {
    // ... (amountToWords function remains the same)
    const a = [
      "",
      "one ",
      "two ",
      "three ",
      "four ",
      "five ",
      "six ",
      "seven ",
      "eight ",
      "nine ",
      "ten ",
      "eleven ",
      "twelve ",
      "thirteen ",
      "fourteen ",
      "fifteen ",
      "sixteen ",
      "seventeen ",
      "eighteen ",
      "nineteen ",
    ];
    const b = [
      "",
      "",
      "twenty",
      "thirty",
      "forty",
      "fifty",
      "sixty",
      "seventy",
      "eighty",
      "ninety",
    ];

    const inWords = (num) => {
      if (num === 0) return "";
      if (num < 20) return a[num];
      if (num < 100) return b[Math.floor(num / 10)] + " " + a[num % 10];
      if (num < 1000)
        return a[Math.floor(num / 100)] + " hundred " + inWords(num % 100);
      if (num < 100000)
        return (
          inWords(Math.floor(num / 1000)) + " thousand " + inWords(num % 1000)
        );
      if (num < 10000000)
        return (
          inWords(Math.floor(num / 100000)) + " lakh " + inWords(num % 100000)
        );
      return (
        inWords(Math.floor(num / 10000000)) +
        " crore " +
        inWords(Math.floor(num % 10000000))
      );
    };

    const [rupees, paise] = grandTotal.toFixed(2).split(".").map(Number);
    let result = "";
    if (rupees > 0) {
      result += inWords(rupees).trim() + " rupees";
    }

    if (paise > 0) {
      result += (result ? " and " : "") + inWords(paise).trim() + " paise";
    } else {
      result += (result ? " and " : "") + "zero paise";
    }
    if (result.startsWith("and")) {
      result = result.substring(4);
    }
    return result;
  };


  // Column config 
  const totalColumns = 7;
  const summaryColSpan = totalColumns - 1; // 6
  const gstTextColSpan = 4;
  const gstAmountColSpan = 3;


  return (
    <div className="p-4 max-w-4xl mx-auto bg-white border border-gray-400 font-sans text-xs print:shadow-none print:border-none">
      <style>{customStyles}</style>

      {/* Invoice Container - Page 1 */}
      <div className="invoice-container">
        <form>
          <table className="w-full border-collapse">
            <thead>
              {/* --- Invoice Header --- */}
              <tr className="print-header-row">
                <td colSpan={totalColumns} className="p-1">
                  <div className="flex justify-between items-start text-xs print:text-[8px] print:leading-none">
                    {/* Invoice Title */}
                    <h2 className="font-bold invoice-title">GST INVOICE</h2>
                    {/* Delivery Title (Hidden on this page during print) */}
                    <h2 className="font-bold delivery-title">DELIVERY CHALLAN</h2>
                    <h2 className="font-bold">(ORIGINAL FOR RECIPIENT)</h2>
                  </div>
                </td>
              </tr>
              <tr className="print-header-row">
                <td colSpan={totalColumns} className="p-0">
                  <div className="grid grid-cols-2 mt-2 border-t border-b border-gray-400">
                    <div className="border-r border-gray-400 p-2 leading-tight">
                      <p className="font-bold text-base print:text-sm">
                        {shop.shopName}
                      </p>
                      <p>{shop.address}</p>
                      <p>FSSAI NO. : {shop.fssaiNo}</p>
                      <p>GSTIN/UIN: {shop.gstNumber}</p>
                      <p>
                        STATE Name: {shop.state}, Code: {shop.stateCode}
                      </p>
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
                          <span className="print-only-text font-bold">
                            {cashierName || "N/A"}
                          </span>

                          <select
                            value={cashierName}
                            onChange={(e) => setCashierName(e.target.value)}
                            className="w-full border rounded p-1 text-xs print-hidden-input"
                          >
                            {CASHIER_NAMES.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="p-1 bg-yellow-200">
                          <p>Mode/Terms of Payment</p>
                          <p className="font-bold">
                            {getPaymentMethodText(payment.method)}
                          </p>
                        </div>
                      </div>
                      <div className="p-2">
                        <p>Buyer (Bill to)</p>
                        <p className="font-bold">{customer.name}</p>
                        <p>{customer.address}</p>
                        <p>State Name: Uttar Pradesh, Code: 09</p>
                        <p>E-Mail: {customer.email || ""}</p>
                        <p>Contact: {customer.mobile}</p>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>

              {/* Table Headers */}
              <tr className="bg-gray-100 text-center">
                <th className="border-r border-b border-gray-400 w-[2%] p-1">
                  Sl No
                </th>
                <th className="border-r border-b border-gray-400 w-[20%] p-1 text-left summary-text-col">
                  Description of Goods
                </th>

                <th className="border-r border-b border-gray-400 w-[5%] p-1">
                  GST Rate
                </th>
                <th className="border-r border-b border-gray-400 w-[5%] p-1">
                  Quantity
                </th>
                <th className="border-r border-b border-gray-400 w-[5%] p-1">
                  Rate
                </th>
                <th className="border-r border-b border-gray-400 w-[5%] p-1">
                  per
                </th>
                <th className="border-b border-gray-400 w-[10%] p-1">Amount</th>
              </tr>
            </thead>
            <tbody>
              {/* Item Rows - Use default Invoice settings */}
              <ItemRows
                items={items}
                gstRate={gstRate}
                handleInputChange={handleInputChange}
                handleRemoveItem={handleRemoveItem}
              />

              {/* New Item Row (Print Hidden) */}
              <tr className="print-hidden-input">
                <td className="border-r border-b border-gray-400 text-center p-1">
                  {items.length + 1}
                </td>
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

                <td className="border-r border-b border-gray-400 text-center p-1">
                  {gstRate}%
                </td>
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
                <td className="border-r border-b border-gray-400 text-center p-1">
                  pcs
                </td>
                <td className="border-b border-gray-400 text-right pr-1 p-1">
                  ₹{(newItem.qty * newItem.price).toFixed(2)}
                </td>
              </tr>

              {/* --- Summary Rows --- */}
              <tr>
                <td colSpan={summaryColSpan} className="text-right font-bold p-1">
                  Total
                </td>
                <td className="border-b border-gray-400 text-right pr-1 p-1 font-bold">
                  ₹{totalBeforeDiscount.toFixed(2)}
                </td>
              </tr>

              <tr>
                <td
                  colSpan={summaryColSpan - 1}
                  className="text-right font-bold p-1 border-b border-gray-400"
                >
                  Discount
                </td>
                <td
                  colSpan="1"
                  className="text-right p-1 border-b border-gray-400 print:hidden"
                >
                  <div className="flex justify-end items-center space-x-2">
                    {/* Discount Input */}
                    <input
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="border p-1 w-20 text-xs rounded"
                      placeholder="e.g. 10"
                      min="0"
                    />
                    {/* Discount Type Selector */}
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="border p-1 text-xs rounded font-bold"
                    >
                      <option value="%">%</option>
                      <option value="₹">₹</option>
                    </select>
                  </div>
                </td>
                <td
                  colSpan="1"
                  className="text-right pr-1 p-1 font-bold border-b border-gray-400 text-red-600"
                >
                  {discountType === '%' ? `(-${discountValue}%)` : ''} - ₹{totalDiscount.toFixed(2)}
                </td>
              </tr>

              <tr>
                <td colSpan={summaryColSpan} className="text-right font-bold p-1">
                  Total After Discount
                </td>
                <td className="border-b border-gray-400 text-right pr-1 p-1 font-bold">
                  ₹{totalBeforeGST.toFixed(2)}
                </td>
              </tr>

              <tr>
                <td
                  colSpan={gstTextColSpan}
                  className="border-t border-b border-r border-gray-400 p-1 text-left"
                >
                  <p>CGST ({gstRate / 2}%)</p>
                  <p>SGST ({gstRate / 2}%)</p>
                </td>
                <td
                  colSpan={gstAmountColSpan}
                  className="border-t border-b border-gray-400 p-1 text-right"
                >
                  <p>₹{(totalGst / 2).toFixed(2)}</p>
                  <p>₹{(totalGst / 2).toFixed(2)}</p>
                </td>
              </tr>

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

        {/* Grand Total Footer (Same as DeliverySlip) */}
        <div className="grid grid-cols-2 text-right border-t border-b border-gray-400">
          <div className="border-r border-gray-400 p-1 text-base">
            <p className="font-bold">Grand Total</p>
          </div>
          <div className="p-1 text-base">
            <p className="font-bold">₹{grandTotal.toFixed(2)}</p>
          </div>
        </div>

        {/* Other Footer Sections and Buttons (Same as DeliverySlip) */}
        <div className="p-1 border-t border-gray-400">
          <p>
            <strong>Amount Chargeable (in words)</strong>
          </p>
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
          <div className="mt-2 text-[10px] bold italic">
            <p>
              We declare that this document shows the actual price of the goods
              described and that all particulars are true and correct.
            </p>
          </div>
          <div className="mt-2 text-center text-[10px] flex justify-between items-end">
            <p className="italic">This is a Computer Generated Document</p>
            <div className="text-center">
              <p>For {shop.shopName}</p>
              <p className="mt-8 border-t border-black font-bold">
                Authorized Signatory
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* End of Invoice Container */}

      {/* --- RENDER DELIVERY SLIP COMPONENT - Page 2 (Uses the same props) --- */}
      <DeliverySlip
        orderId={orderId}
        invoiceDate={invoiceDate}
        customer={customer}
        items={items}
        grandTotal={grandTotal}
        shop={shop}
        getPaymentMethodText={getPaymentMethodText}
        payment={payment}
        gstRate={gstRate}
        handleInputChange={handleInputChange}
        handleRemoveItem={handleRemoveItem}
        totalBeforeDiscount={totalBeforeDiscount}
        totalDiscount={totalDiscount}
        totalBeforeGST={totalBeforeGST}
        totalGst={totalGst}
        roundOffAmount={roundOffAmount}
        amountToWords={amountToWords}
        cashierName={cashierName}
        setCashierName={setCashierName}
        discountValue={discountValue}
        setDiscountValue={setDiscountValue}
        discountType={discountType}
        setDiscountType={setDiscountType}
        CASHIER_NAMES={CASHIER_NAMES}
        totalColumns={totalColumns}
        summaryColSpan={summaryColSpan}
        gstTextColSpan={gstTextColSpan}
        gstAmountColSpan={gstAmountColSpan}
        inputRefs={inputRefs}
        newItem={newItem}
        handleNewItemChange={handleNewItemChange}
        handleKeyDown={handleKeyDown}
        handleAddItem={handleAddItem}
      />

      {/* Final Action Buttons (Print Hidden) - Consolidated */}
      <div className="flex justify-end mt-8 print:hidden space-x-4">
        <button
          onClick={handleViewBill}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Print Invoice & Challan (2 Pages)
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