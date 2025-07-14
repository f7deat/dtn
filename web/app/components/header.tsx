const Header: React.FC = () => {
    return (
        <header className="bg-white shadow flex items-center justify-between" hidden>
            <div className="uppercase text-2xl font-bold text-red-600 px-4 py-2">
                Đoàn Thanh niên Đại học Hải Phòng
            </div>
            <ul className="flex-1 flex">
                <li className="text-lg font-bold"><a href="#">Trang chủ</a></li>
                <li className="text-lg font-bold"><a href="/about">Giới thiệu</a></li>
                <li className="text-lg font-bold"><a href="/news">Tin tức</a></li>
                <li className="text-lg font-bold"><a href="/activities">Hoạt động</a></li>
                <li className="text-lg font-bold"><a href="/contact">Liên hệ</a></li>
            </ul>
            <div>
            </div>
        </header>
    )
}

export default Header;