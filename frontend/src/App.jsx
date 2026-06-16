import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RoomPage from './pages/RoomPage';
import ChatPage from './pages/ChatPage';
import  TrackingPage  from './pages/TrackingPage';
import CartPage from './pages/CartPage';
import { ThemeProvider } from './context/ThemeContext';
import RidePage from './pages/RidePage';
import PaymentPage from './pages/PaymentPage';
import RidePaymentPage from './pages/RidePaymentPage';
import ProfilePage from './pages/ProfilePage';


function App() {
    return (
        <ThemeProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
                <Routes>
                    <Route path="/" element={<LoginPage />} />
                    <Route path="/rooms" element={<RoomPage />} />
                    <Route path="/room/:groupId" element={<CartPage />} />
                    <Route path="/rides/track/:id" element={<TrackingPage />} />
                    <Route path="/chat/:groupId" element={<ChatPage />} />
                    <Route path="/rides" element={<RidePage />} />
                    <Route path="/ride/:id" element={<RidePage />} />
                    <Route path="/payment/:groupId" element={<PaymentPage />} />
                    <Route path="/rides/payment/:rideId" element={<RidePaymentPage />} />
                    <Route path="/rides/chat/:groupId" element={<ChatPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                </Routes>
            </div>
        </Router>
        </ThemeProvider>
    );
}

export default App;
