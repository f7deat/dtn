import { faExternalLink, faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

const Header: React.FC = () => {
    return (
        <header className="bg-white flex items-center justify-between h-22">
            <div className="uppercase font-bold pl-10 py-2 pr-20 text-lg">
                Đoàn Thanh niên <span className="text-red-600">Đại học Hải Phòng</span>
            </div>
            <div className="flex-1 flex items-center justify-center nav-menu h-full">
                <ul className="flex gap-8 z-10 relative">
                    <li className="text-lg font-bold"><a href="#">Trang chủ</a></li>
                    <li className="text-lg font-bold"><a href="/about">Giới thiệu</a></li>
                    <li className="text-lg font-bold"><a href="/news">Tin tức</a></li>
                    <li className="text-lg font-bold"><a href="/activities">Hoạt động</a></li>
                    <li className="text-lg font-bold"><a href="/contact">Liên hệ</a></li>
                    <li className="text-lg font-bold"><a href="/search"><FontAwesomeIcon icon={faSearch} className="w-5 h-5 inline" /></a></li>
                </ul>
            </div>
            <div className="h-full flex items-center gap-4 pl-20">
                <Link href="/login" className="bg-red-600 text-white px-6 py-3 rounded hover:bg-red-700 transition-colors font-bold uppercase">Đăng nhập<FontAwesomeIcon icon={faExternalLink} className="ml-2 w-4 h-4 inline" /></Link>
                <button type="button" className="bg-black text-white h-full w-22 flex items-center justify-center flex-col gap-3">
                    <span className="border-b border-white w-10"></span>
                    <span className="border-b border-white w-10"></span>
                    <span className="border-b border-white w-10"></span>
                </button>
            </div>
        </header>
    )
}

export default Header;