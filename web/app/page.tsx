/* eslint-disable @next/next/no-img-element */
import { faFlag } from "@fortawesome/free-regular-svg-icons";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dayjs from "dayjs";
import Link from "next/link";

export default function Home() {
  return (
    <main>
      <div className="container mx-auto py-8 md:py-20">
        <div className="text-center mb-4">
          <div className="text-sm text-red-700 font-bold uppercase"><FontAwesomeIcon icon={faFlag} className="w-3 h-3 inline" /> News - Event</div>
          <div className="text-3xl md:text-4xl font-bold mt-2">
            Tin tức & Sự kiện
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-100">
            <div className="mb-4 relative">
              <img src="https://placehold.co/600x400" alt="IMG" />
              <div className="absolute bottom-0 left-0 bg-red-600 text-white w-20 flex flex-col items-center justify-center py-2 font-bold">
                <span>{dayjs().format("MMM")}</span>
                <span>{dayjs().format("DD")},</span>
                <span>{dayjs().format("YYYY")}</span>
              </div>
            </div>
            <div className="px-4">
              <div className="font-bold text-lg md:text-xl mb-2 line-clamp-2">
                KHỞI ĐỘNG CHIẾN DỊCH MÙA HÈ XANH VÀ TẬP HUẤN CHIẾN DỊCH MÙA HÈ XANH NĂM 2025
              </div>
              <div className="uppercase mb-4">
                <Link href="/news/1" className="text-red-600 hover:underline text-sm font-bold">
                  Xem chi tiết <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3 inline" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
