import { faFacebook, faInstagram, faLinkedin, faTiktok } from "@fortawesome/free-brands-svg-icons";
import { faEnvelope } from "@fortawesome/free-regular-svg-icons";
import { faCaretRight, faMapMarkerAlt, faPhone } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

/* eslint-disable @next/next/no-img-element */
const Footer: React.FC = () => {
    return (
        <footer className="text-white">
            <div className="bg-slate-900">
                <div className="container mx-auto px-4 py-8 md:py-20">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <div className="mb-4">
                                <img src="https://upload.wikimedia.org/wikipedia/vi/0/09/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png" alt="Logo" className="w-28" />
                            </div>
                            <div className="mb-4">
                                Mỗi thanh niên là một ngọn lửa, hãy để tinh thần Đoàn Thanh niên thắp sáng con đường phía trước
                            </div>
                            <div className="flex gap-4">
                                <a href="#" className="bg-red-600 text-white w-10 h-10 flex items-center justify-center rounded hover:bg-red-700 transition-colors">
                                    <FontAwesomeIcon icon={faFacebook} className="w-5 h-5" />
                                </a>
                                <a href="#" className="bg-red-600 text-white w-10 h-10 flex items-center justify-center rounded hover:bg-red-700 transition-colors">
                                    <FontAwesomeIcon icon={faInstagram} className="w-5 h-5" />
                                </a>
                                <a href="#" className="bg-red-600 text-white w-10 h-10 flex items-center justify-center rounded hover:bg-red-700 transition-colors">
                                    <FontAwesomeIcon icon={faTiktok} className="w-5 h-5" />
                                </a>
                                <a href="#" className="bg-red-600 text-white w-10 h-10 flex items-center justify-center rounded hover:bg-red-700 transition-colors">
                                    <FontAwesomeIcon icon={faLinkedin} className="w-5 h-5" />
                                </a>

                            </div>
                        </div>
                        <div>
                            <div className="text-lg md:text-2xl 2xl:text-3xl font-bold mb-4 2xl:mb-6">Liên kết nhanh</div>
                            <ul className="text-slate-400 grid grid-cols-2">
                                <li className="mb-2"><FontAwesomeIcon icon={faCaretRight} className="w-4 h-4 inline text-red-600 mr-1" /><Link href="/" className="hover:text-white transition-colors">Trang chủ</Link></li>
                                <li className="mb-2"><FontAwesomeIcon icon={faCaretRight} className="w-4 h-4 inline text-red-600 mr-1" /><Link href="/about" className="hover:text-white transition-colors">Giới thiệu</Link></li>
                                <li className="mb-2"><FontAwesomeIcon icon={faCaretRight} className="w-4 h-4 inline text-red-600 mr-1" /><Link href="/news" className="hover:text-white transition-colors">Tin tức</Link></li>
                                <li className="mb-2"><FontAwesomeIcon icon={faCaretRight} className="w-4 h-4 inline text-red-600 mr-1" /><Link href="/activities" className="hover:text-white transition-colors">Hoạt động</Link></li>
                                <li className="mb-2"><FontAwesomeIcon icon={faCaretRight} className="w-4 h-4 inline text-red-600 mr-1" /><Link href="/contact" className="hover:text-white transition-colors">Liên hệ</Link></li>
                                <li className="mb-2"><FontAwesomeIcon icon={faCaretRight} className="w-4 h-4 inline text-red-600 mr-1" /><Link href="/support" className="hover:text-white transition-colors">Hỗ trợ</Link></li>
                                <li className="mb-2"><FontAwesomeIcon icon={faCaretRight} className="w-4 h-4 inline text-red-600 mr-1" /><a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a></li>
                                <li className="mb-2"><FontAwesomeIcon icon={faCaretRight} className="w-4 h-4 inline text-red-600 mr-1" /><a href="#" className="hover:text-white transition-colors">Điều khoản sử dụng</a></li>
                                <li className="mb-2"><FontAwesomeIcon icon={faCaretRight} className="w-4 h-4 inline text-red-600 mr-1" /><a href="#" className="hover:text-white transition-colors">FAQs</a></li>
                                <li className="mb-2"><FontAwesomeIcon icon={faCaretRight} className="w-4 h-4 inline text-red-600 mr-1" /><a href="#" className="hover:text-white transition-colors">Sitemap</a></li>
                                <li className="mb-2"><FontAwesomeIcon icon={faCaretRight} className="w-4 h-4 inline text-red-600 mr-1" /><a href="#" className="hover:text-white transition-colors">Bản đồ</a></li>
                                <li className="mb-2"><FontAwesomeIcon icon={faCaretRight} className="w-4 h-4 inline text-red-600 mr-1" /><a href="#" className="hover:text-white transition-colors">Tuyển dụng</a></li>
                            </ul>
                        </div>
                        <div>
                            <div className="text-lg md:text-2xl 2xl:text-3xl font-bold mb-4 2xl:mb-6">Bài viết mới</div>
                        </div>
                        <div>
                            <div className="text-lg md:text-2xl 2xl:text-3xl font-bold mb-4 2xl:mb-6">Liên hệ</div>
                            <div className="text-slate-400 mb-2">
                                <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 inline mr-2 text-red-600" /> Email: <a href="mailto:contact@dtn.edu.vn">contact@dtn.edu.vn</a>
                            </div>
                            <div className="text-slate-400 mb-2">
                                <FontAwesomeIcon icon={faPhone} className="w-4 h-4 inline mr-2 text-red-600" /> Điện thoại: <a href="tel:+840123456789">+84 0123 456 789</a>
                            </div>
                            <div className="text-slate-400 mb-2">
                                <FontAwesomeIcon icon={faMapMarkerAlt} className="w-4 h-4 inline mr-2 text-red-600" /> Địa chỉ: Số 1, đường Nguyễn Bình, quận Kiến An, thành phố Hải Phòng
                            </div>
                        </div>
                    </div>
                </div>
                <div className="border-t border-slate-700 py-4 text-center">
                    <p className="text-slate-400">
                        © Copyright {new Date().getFullYear()} <Link href="/" className="text-red-600 hover:text-red-700">Đoàn Thanh niên trường Đại học Hải Phòng</Link>. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    )
}

export default Footer;