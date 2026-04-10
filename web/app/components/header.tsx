/* eslint-disable @next/next/no-img-element */
"use client";

import { getCurrentUser } from "../services/auth";
import { faExternalLink, faSearch, faTimes, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import LogoutButton from "./logout-button";
import { useEffect } from "react";
import { useState } from "react";

const Header: React.FC = () => {

    const [currentUser, setCurrentUser] = useState<API.CurrentUser | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        getCurrentUser().then(user => {
            setCurrentUser(user);
            console.log("Current user in header:", user);
        });
    }, []);

    useEffect(() => {
        // Prevent body scroll when mobile menu is open
        if (mobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [mobileMenuOpen]);

    const displayName = currentUser?.fullName ?? [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(" ") ?? currentUser?.userName;

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
                {currentUser ? (
                    <div className="hidden md:flex items-center gap-3">
                        <Link href="/profile" className="bg-red-600 text-white px-4 md:px-6 py-3 rounded hover:bg-red-700 transition-colors font-bold uppercase">
                            {displayName ? `Hồ sơ: ${displayName}` : "Hồ sơ cá nhân"}
                        </Link>
                        <LogoutButton />
                    </div>
                ) : (
                    <Link href="/login" className="bg-red-600 hidden md:block text-white px-4 md:px-6 py-3 rounded hover:bg-red-700 transition-colors font-bold uppercase">Đăng nhập<FontAwesomeIcon icon={faExternalLink} className="ml-2 w-4 h-4 inline" /></Link>
                )}
                <button 
                    type="button" 
                    className="bg-black text-white h-full w-16 md:w-22 flex items-center justify-center flex-col gap-3"
                    onClick={() => setMobileMenuOpen(true)}
                    aria-label="Menu"
                >
                    <span className="border-b border-white w-8 md:w-10"></span>
                    <span className="border-b border-white w-8 md:w-10"></span>
                    <span className="border-b border-white w-8 md:w-10"></span>
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-50 z-40 animate-fadeIn"
                        onClick={() => setMobileMenuOpen(false)}
                    ></div>

                    {/* Sidebar */}
                    <div className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl z-50 overflow-y-auto animate-slideInRight">
                        <div className="flex flex-col h-full">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b">
                                <h2 className="text-lg font-bold">Menu</h2>
                                <button 
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded"
                                    aria-label="Đóng menu"
                                >
                                    <FontAwesomeIcon icon={faTimes} className="w-6 h-6" />
                                </button>
                            </div>

                            {/* User Info */}
                            {currentUser && (
                                <div className="p-4 bg-gray-50 border-b">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
                                            {displayName?.charAt(0).toUpperCase() || "U"}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-900">{displayName}</p>
                                            <p className="text-sm text-gray-600">{currentUser.userName}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Navigation Links */}
                            <nav className="flex-1 p-4">
                                <ul className="space-y-2">
                                    <li>
                                        <Link 
                                            href="/" 
                                            className="block px-4 py-3 text-gray-900 hover:bg-gray-100 rounded font-semibold"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            Trang chủ
                                        </Link>
                                    </li>
                                    <li>
                                        <a 
                                            href="/about" 
                                            className="block px-4 py-3 text-gray-900 hover:bg-gray-100 rounded font-semibold"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            Giới thiệu
                                        </a>
                                    </li>
                                    <li>
                                        <Link 
                                            href="/article" 
                                            className="block px-4 py-3 text-gray-900 hover:bg-gray-100 rounded font-semibold"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            Tin tức
                                        </Link>
                                    </li>
                                    <li>
                                        <a 
                                            href="/activities" 
                                            className="block px-4 py-3 text-gray-900 hover:bg-gray-100 rounded font-semibold"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            Hoạt động
                                        </a>
                                    </li>
                                    <li>
                                        <a 
                                            href="/contact" 
                                            className="block px-4 py-3 text-gray-900 hover:bg-gray-100 rounded font-semibold"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            Liên hệ
                                        </a>
                                    </li>
                                    <li>
                                        <a 
                                            href="/search" 
                                            className="block px-4 py-3 text-gray-900 hover:bg-gray-100 rounded font-semibold"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            <FontAwesomeIcon icon={faSearch} className="w-4 h-4 inline mr-2" />
                                            Tìm kiếm
                                        </a>
                                    </li>
                                </ul>
                            </nav>

                            {/* Action Buttons */}
                            <div className="p-4 border-t space-y-3">
                                {currentUser ? (
                                    <>
                                        <Link 
                                            href="/profile" 
                                            className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded hover:bg-red-700 transition-colors font-bold w-full"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            <FontAwesomeIcon icon={faUser} className="w-4 h-4" />
                                            Hồ sơ cá nhân
                                        </Link>
                                        <div onClick={() => setMobileMenuOpen(false)}>
                                            <LogoutButton variant="mobile" />
                                        </div>
                                    </>
                                ) : (
                                    <Link 
                                        href="/login" 
                                        className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded hover:bg-red-700 transition-colors font-bold w-full"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <FontAwesomeIcon icon={faExternalLink} className="w-4 h-4" />
                                        Đăng nhập
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </header>
    )
}

export default Header;