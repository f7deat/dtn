import Link from "next/link";

type Props = {
    title?: string;
    items?: { label: string; href: string }[];
}

const Breadcrumb: React.FC<Props> = ({ title, items }) => {
    return (
        <nav className="bg-white p-4 h-32 flex items-center justify-center flex-col gap-4 2xl:h-40" style={{
            backgroundImage: 'url("https://api.dtn.dhhp.edu.vn/imgs/breadcrumb.webp")',
        }}>
            <div className="font-bold text-2xl text-red-600 uppercase 2xl:text-3xl">
                {title || "Breadcrumb"}
            </div>
            <ol className="list-reset flex text-gray-700 items-center">
                <li>
                    <Link href="/" className="text-blue-600 hover:text-blue-800">Trang chủ</Link>
                </li>
                <li className="mx-2 text-slate-600 text-xs">/</li>
                {
                    items && items.map((item, index) => {
                        if (index === items.length - 1) {
                            return (
                                <li key={index} className="text-gray-500">
                                    {item.label}
                                </li>
                            );
                        }
                        return (
                            <li key={index}>
                                <Link href={item.href} className="text-blue-600 hover:text-blue-800">
                                    {item.label}
                                </Link>
                            </li>
                        )
                    })
                }
            </ol>
        </nav>
    );
}

export default Breadcrumb;