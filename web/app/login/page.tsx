/* eslint-disable @next/next/no-img-element */
import { faStar } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import LoginForm from "./components/form";
import Breadcrumb from "../components/breadcrumb";

const Page: React.FC = () => {
    return (
        <main>
            <Breadcrumb title="Đăng nhập" items={[
                { label: "Đăng nhập", href: "/login" }
            ]} />
            <div className="container mx-auto py-8 md:py-20 max-w-5xl">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="mb-4">
                        <div className="flex justify-center max-w-md">
                            <div className="text-center mb-4 max-w-md mx-auto">
                                <div className="text-sm text-red-700 font-bold uppercase"><FontAwesomeIcon icon={faStar} className="w-3 h-3 inline" /> Login</div>
                                <div className="text-3xl md:text-4xl font-bold mt-2">
                                    Đăng nhập
                                </div>
                            </div>
                        </div>
                        <LoginForm />
                        <div className="text-right">Quên mật khẩu?</div>
                        <div className="text-right mt-2">
                            <span className="text-sm text-slate-500">Bạn là người quản trị? </span>
                            <a href="https://admin.dtn.dhhp.edu.vn" className="text-red-600 hover:underline" target="_blank">Đăng nhập tại đây</a>
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <img src="https://static.vecteezy.com/system/resources/previews/003/689/228/non_2x/online-registration-or-sign-up-login-for-account-on-smartphone-app-user-interface-with-secure-password-mobile-application-for-ui-web-banner-access-cartoon-people-illustration-vector.jpg" alt="Login Illustration" className="w-full h-auto" />
                    </div>
                </div>
            </div>
        </main>
    );
}

export default Page;
