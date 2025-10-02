import React, { useContext, useState } from 'react';
import Nav from '../components/Nav';
import Categories from './Category';
import Card from '../components/Card';
import { food_items } from '../food';
import { dataContext } from '../context/UserContext';
import { RxCross2 } from 'react-icons/rx';
import { FiArrowLeft } from "react-icons/fi";
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { incrementQty, decrementQty } from '../redux/cartSlice';
import qrImage from '../assets/qr.png';
import { useNavigate } from 'react-router-dom';

function Home() {
  const { cate, setCate, input, showCart, setShowCart } = useContext(dataContext);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [orderId, setOrderId] = useState(() => {
    const saved = localStorage.getItem("orderIdCounter");
    return saved ? parseInt(saved, 10) : 1;
  });

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState('pickup');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [upiId, setUpiId] = useState('');
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '' });
  const [category, setCategory] = useState('All');

  const filter = (category) => {
    if (category === 'All') {
      setCate(food_items);
    } else {
      const newList = food_items.filter(item => item.food_category === category);
      setCate(newList);
    }
    setCategory(category);
    console.log(category);
  };

  const items = useSelector(state => state.cart.items);
  const subtotal = items.reduce((total, item) => total + item.qty * item.price, 0);
  const deliveryFee = deliveryType === 'home' ? 50 : 0;
  const total = Math.floor(subtotal + deliveryFee);

  const handleProceedToBilling = () => {
    if (items.length === 0) return toast.error("Cart is empty!");
    if (!name || !address || !phone || !deliveryType) return toast.error("Fill customer details.");
    if (!paymentMethod) return toast.error("Select payment method");

    if (paymentMethod === 'upi' && !upiId) return toast.error("Enter UPI ID");
    if (paymentMethod === 'card') {
      const { number, expiry, cvv } = cardDetails;
      if (!number || !expiry || !cvv) return toast.error("Fill card details");
    }
    
    // Increment the orderId and save to localStorage
    const newOrderId = orderId + 1;
    setOrderId(newOrderId);
    localStorage.setItem("orderIdCounter", newOrderId.toString());

    const order = {
      orderId, // Pass the current orderId
      customer: { name, address, phone, deliveryType },
      items,
      subtotal,
      deliveryFee,
      total,
      payment: {
        method: paymentMethod,
        upiId,
        card: cardDetails,
      },
      placedAt: new Date().toLocaleString(),
    };

    navigate("/billing", { state: { order } });
  };

  return (
    <div className="bg-[url('https://images.unsplash.com/photo-1600891964599-f61ba0e24092')] bg-cover bg-center w-full min-h-screen">
      <Nav />
      {!input && (
        <div className='flex transition-all flex-wrap justify-center items-center gap-3 w-full'>
          {Categories.map(item => (
            <div key={item.id} onClick={() => filter(item.name)}
              className={`flex transition-all p-2 justify-center items-center gap-3 rounded-full  cursor-pointer ${(category === item.name) ? 'bg-green-600 hover:bg-green-600/90 text-white' : 'bg-white hover:bg-white/90'}`} >
              <div className={`${(category !== item.name) ? "text-green-600" : "text-white" }`}> {item.icon}</div>
              {item.name}
            </div>
          ))}
        </div>
      )}

      <div className='w-full flex flex-wrap gap-5 px-5 justify-center items-center pt-8 pb-8'>
        {cate.length > 0 ? (
          cate.map(item => (
            <Card key={item.id} name={item.food_name} image={item.food_image} price={item.price} id={item.id} type={item.food_type} />
          ))
        ) : (
          <div className='text-center text-2xl text-green-500 font-semibold pt-5'>No dish found</div>
        )}
      </div>

      {/* CART */}
      <div className={`w-full md:w-[40vw] fixed top-0 right-0 h-screen bg-white shadow-xl p-6 transition-all duration-500 overflow-y-auto z-50 ${showCart ? 'translate-x-0' : 'translate-x-full'}`}>
        <header className='w-full flex justify-between items-center'>
          <span className='text-green-400 text-[18px] font-semibold'>Order items</span>
          <RxCross2 className='w-[30px] h-[30px] text-green-400 cursor-pointer' onClick={() => setShowCart(false)} />
        </header>

        {items.length > 0 ? (
          <>
            {/* Shop Info */}
            <div className="mt-4 bg-slate-100 p-4 rounded shadow-md flex flex-col justify-center items-center">
              <h2 className="font-bold text-lg">Khandelwal Restro and Restaurant</h2>
              <p>Krishna Nagar, India</p>
              <p>Phone: 7500755265</p>
              <p>GSTIN: 22ABCDE1234F1Z5</p>
              <p>Order ID: {orderId}</p>
              <p>Date: {new Date().toLocaleDateString()}</p>
              <p>Time: {new Date().toLocaleTimeString()}</p>
            </div>

            {/* Customer Inputs */}
            <div className='mt-4 flex flex-col gap-2'>
              <input placeholder='Customer Name' value={name} onChange={e => setName(e.target.value)} className='border p-2 rounded' />
              <input placeholder='Address' value={address} onChange={e => setAddress(e.target.value)} className='border p-2 rounded' />
              <input placeholder='Phone Number' value={phone} onChange={e => setPhone(e.target.value)} className='border p-2 rounded' />
              <select value={deliveryType} onChange={e => setDeliveryType(e.target.value)} className='border p-2 rounded'>
                <option value='pickup'>Pickup (₹0)</option>
                <option value='home'>Home Delivery (₹50)</option>
              </select>
            </div>

            <div className='mt-4'>
              {items.map(item => (
                <div key={item.id} className='border p-2 rounded mb-2 flex justify-between items-center'>
                  <img src={item.image} className='w-12 h-12 object-cover rounded' />
                  <div className='flex-1 ml-3'>
                    <p>{item.name}</p>
                    <p className='text-sm'>₹{item.price} x {item.qty}</p>
                  </div>
                  <div className='flex gap-2'>
                    <button onClick={() => dispatch(decrementQty(item.id))} className='px-2 bg-gray-200'>-</button>
                    <span>{item.qty}</span>
                    <button onClick={() => dispatch(incrementQty(item.id))} className='px-2 bg-gray-200'>+</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className='mt-4 text-right font-semibold'>
              <p>Subtotal: ₹{subtotal}</p>
              <p>Delivery Fee: ₹{deliveryFee}</p>
              <p>Total: ₹{total}</p>
            </div>

            {/* Payment */}
            <div className='mt-4 flex flex-col gap-2'>
              <label className='font-semibold'>Payment Method</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className='border p-2 rounded'>
                <option value="">Select</option>
                <option value="cod">Cash on Delivery</option>
                <option value="upi">UPI</option>
                <option value="paytm">Paytm / PhonePe</option>
                <option value="card">Debit / Credit Card</option>
                <option value="borrow">After Paying</option>
              </select>

              {paymentMethod === 'upi' && (
                <input placeholder='Enter UPI ID' value={upiId} onChange={e => setUpiId(e.target.value)} className='border p-2 rounded' />
              )}

              {paymentMethod === 'paytm' && (
                <div className='flex flex-col items-center'>
                  <img src={qrImage} alt="QR Code" className='w-100 h-80 mx-auto' />
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className='flex flex-col gap-2'>
                  <input placeholder='Card Number' value={cardDetails.number} onChange={e => setCardDetails({ ...cardDetails, number: e.target.value })} className='border p-2 rounded' />
                  <input placeholder='Expiry (MM/YY)' value={cardDetails.expiry} onChange={e => setCardDetails({ ...cardDetails, expiry: e.target.value })} className='border p-2 rounded' />
                  <input placeholder='CVV' value={cardDetails.cvv} onChange={e => setCardDetails({ ...cardDetails, cvv: e.target.value })} className='border p-2 rounded' />
                </div>
              )}
            </div>

            {/* Proceed Button */}
            <button
              onClick={handleProceedToBilling}
              className="mt-6 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 w-full"
            >
              Proceed to Billing
            </button>
          </>
        ) : (
          <div className='text-center text-green-500 mt-8 font-bold text-xl flex flex-col items-center gap-4'>
            <p>Cart is Empty</p>
            <button
              onClick={() => setShowCart(false)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              <FiArrowLeft className="w-5 h-5" />
              Back to Page
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;