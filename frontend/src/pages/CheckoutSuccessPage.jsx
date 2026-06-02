import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const CheckoutSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Checkout data passed from CartPage
  const checkoutData = location.state?.checkoutResult;

  if (!checkoutData) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-900 text-white p-6">
        <h2 className="text-2xl font-bold text-red-500 mb-4">
          No checkout data available.
        </h2>
        <button
          onClick={() => navigate("/cart")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg"
        >
          Go back to rooms
        </button>
      </div>
    );
  }

  const { cartTotal, invoiceUrl, users, invoiceItems } = checkoutData;
  const userId = localStorage.getItem("userId");

  const userData = users[userId];

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-900 text-white p-6 space-y-6">
      <h2 className="text-3xl font-bold text-green-400">Checkout Successful!</h2>

      <div className="bg-gray-800 p-6 rounded-xl w-full max-w-3xl shadow-lg border border-gray-700">
        <h3 className="text-xl font-semibold text-indigo-400 mb-3">Your Order</h3>

        {userData?.items?.map((item, idx) => (
          <div key={idx} className="flex justify-between py-2 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <img
                src={item.image || "https://via.placeholder.com/60"}
                alt={item.itemName}
                className="w-14 h-14 rounded-lg object-cover"
              />
              <span>{item.itemName}</span>
            </div>
            <span>₹{item.price} × {item.quantity} = ₹{item.subtotal}</span>
          </div>
        ))}

        <div className="text-right font-bold text-indigo-400 mt-4">
          Total: ₹{userData?.total || cartTotal}
        </div>

        {invoiceUrl && (
          <div className="mt-4">
            <a
              href={invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:underline"
            >
              View Invoice
            </a>
          </div>
        )}
      </div>

      <button
        onClick={() => navigate("/cart")}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg"
      >
        Back to Cart
      </button>
    </div>
  );
};

export default CheckoutSuccessPage;
