import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop:
 * Tự động đưa vị trí cuộn lên đầu trang (top: 0) mỗi khi chuyển route / URL path thay đổi.
 * Hỗ trợ cả window scroll và các container có overflow-y-auto (như Dashboard layout).
 * Nếu URL có hash (ví dụ: #feature-qr), cuộn chính xác tới phần tử mục tiêu.
 */
const ScrollToTop = () => {
    const { pathname, hash } = useLocation();

    useEffect(() => {
        if (hash) {
            // Đợi một khoảng ngắn để DOM trang mới render xong trước khi cuộn tới hash
            const timer = setTimeout(() => {
                const element = document.querySelector(hash);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                } else {
                    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                }
            }, 100);
            return () => clearTimeout(timer);
        } else {
            // Đưa vị trí cuộn toàn trang về đầu lập tức (0, 0)
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;

            // Đưa tất cả container có thanh cuộn riêng (như <main> trong Dashboard) về đầu
            const mainContainers = document.querySelectorAll('main');
            mainContainers.forEach((m) => {
                m.scrollTop = 0;
            });
        }
    }, [pathname, hash]);

    return null;
};

export default ScrollToTop;
