import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/navigation/Header';
import Footer from '@/components/navigation/Footer';

const PublicLayout = () => {
    return (
        <div className="bg-white dark:bg-[#070d18] text-gray-800 dark:text-gray-100 font-sans min-h-screen flex flex-col transition-colors duration-200">
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