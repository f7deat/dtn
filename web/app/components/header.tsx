import { faExternalLink, faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

const Header: React.FC = () => {
    return (
        <header className="bg-white flex items-center justify-between md:h-22 h-16 shadow">
            <div className="uppercase font-bold md:pl-10 p-4 md:pr-20">
                <Link href="/">
                    <img src="https://api.dtn.dhhp.edu.vn/imgs/logo.png" alt="Logo" className="h-full" />
                </Link>
            </div>
            <div className="flex-1 hidden md:flex items-center justify-center nav-menu h-full">
                <ul className="flex gap-8 z-10 relative">
                    <li className="text-lg font-bold hover:text-red-600"><Link href="/">Trang chủ</Link></li>
                    <li className="text-lg font-bold hover:text-red-600"><a href="/about">Giới thiệu</a></li>
                    <li className="text-lg font-bold hover:text-red-600"><Link href="/article">Tin tức</Link></li>
                    <li className="text-lg font-bold hover:text-red-600"><a href="/activities">Hoạt động</a></li>
                    <li className="text-lg font-bold hover:text-red-600"><a href="/contact">Liên hệ</a></li>
                    <li className="text-lg font-bold hover:text-red-600"><a href="/search"><FontAwesomeIcon icon={faSearch} className="w-5 h-5 inline" /></a></li>
                </ul>
            </div>
            <div className="h-full flex items-center gap-4 md:pl-20 pl-2">
                <Link href="/login" className="bg-red-600 hidden md:block text-white px-4 md:px-6 py-3 rounded hover:bg-red-700 transition-colors font-bold uppercase">Đăng nhập<FontAwesomeIcon icon={faExternalLink} className="ml-2 w-4 h-4 inline" /></Link>
                <button type="button" className="bg-black text-white h-full w-16 md:w-22 flex items-center justify-center flex-col gap-3">
                    <span className="border-b border-white w-8 md:w-10"></span>
                    <span className="border-b border-white w-8 md:w-10"></span>
                    <span className="border-b border-white w-8 md:w-10"></span>
                </button>
            </div>
        </header>
    )
}

export default Header;