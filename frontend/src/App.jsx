import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RoomPage from './pages/RoomPage';
import ChatPage from './pages/ChatPage';
import TrackingAndNotFound from './pages/TrackingAndNotFound';
import CartPage from './pages/CartPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import { ThemeProvider } from './context/ThemeContext';
import RidePage from './pages/RidePage';
import PaymentPage from './pages/PaymentPage';



function App() {
    return (
        <ThemeProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
                <Routes>
                    <Route path="/" element={<LoginPage />} />
                    <Route path="/rooms" element={<RoomPage />} />
                    <Route path="/room/:groupId" element={<CartPage />} />
                    <Route path="/track/:id" element={<TrackingAndNotFound />} />
                    <Route path="/chat/:groupId" element={<ChatPage />} />
                    <Route path="/checkout-success" element={<CheckoutSuccessPage />} />
                    <Route path="/rides" element={<RidePage />} />
                    <Route path="/ride/:id" element={<RidePage />} />
                    <Route path="/payment/:groupId" element={<PaymentPage />} />
                </Routes>
            </div>
        </Router>
        </ThemeProvider>
    );
}

export default App;
