import { faStar } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Page: React.FC = () => {
    return (
        <main className="container mx-auto py-8 md:py-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="text-center mb-4">
                    <div className="text-center mb-4">
                        <div className="text-sm text-red-700 font-bold uppercase"><FontAwesomeIcon icon={faStar} className="w-3 h-3 inline" /> Login</div>
                        <div className="text-3xl md:text-4xl font-bold mt-2">
                            Đăng nhập
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default Page;
