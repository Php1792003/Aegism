import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PublicLayout = () => {
    return (
        <div className="bg-white text-gray-800 font-sans min-h-screen flex flex-col">
            {/* Header luôn hiển thị ở trên cùng */}
            <Header />

            {/* Nội dung thay đổi của từng trang sẽ hiển thị ở đây */}
            <main className="flex-grow">
                <Outlet />
            </main>

            {/* Footer luôn hiển thị ở dưới cùng */}
            <Footer />
        </div>
    );
};

export default PublicLayout;