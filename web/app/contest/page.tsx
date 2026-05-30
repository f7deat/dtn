import { apiContestList } from "../services/contest";
import Breadcrumb from "../components/breadcrumb";
import dayjs from "dayjs";
import Link from "next/link";

const Page = async () => {
    const contests = await apiContestList({ current: 1, pageSize: 100 });

    return (
        <main>
            <Breadcrumb title="Cuộc thi sinh viên" items={[
                { label: "Cuộc thi", href: "/contest" }
            ]} />
            <section className="container mx-auto px-4 md:px-0 py-10 md:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {contests.map((contest) => (
                        <article key={contest.id} className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                            <div className="bg-gradient-to-r from-red-600 to-amber-500 px-6 py-5 text-white">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <div className="text-xs uppercase tracking-[0.3em] font-bold opacity-80">Contest</div>
                                        <h2 className="text-2xl font-bold mt-2">{contest.title}</h2>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${contest.isOpened ? "bg-white text-red-600" : contest.hasEnded ? "bg-black/20 text-white" : "bg-amber-100 text-amber-900"}`}>
                                        {contest.isOpened ? "Đang nhận bài" : contest.hasEnded ? "Đã kết thúc" : "Sắp mở"}
                                    </span>
                                </div>
                            </div>
                            <div className="p-6">
                                <p className="text-slate-600 leading-7 min-h-14">{contest.description || "Chưa có mô tả cho cuộc thi này."}</p>
                                <div className="grid grid-cols-2 gap-3 text-sm mt-5">
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <div className="text-slate-500 uppercase text-xs font-bold">Bắt đầu</div>
                                        <div className="font-bold text-slate-900 mt-1">{dayjs(contest.startDate).format("DD/MM/YYYY")}</div>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <div className="text-slate-500 uppercase text-xs font-bold">Kết thúc</div>
                                        <div className="font-bold text-slate-900 mt-1">{dayjs(contest.endDate).format("DD/MM/YYYY")}</div>
                                    </div>
                                </div>
                                <div className="mt-6 flex items-center justify-between gap-4">
                                    <div className="text-sm text-slate-500">Đã có <span className="font-bold text-slate-900">{contest.submissionCount}</span> bài dự thi</div>
                                    <Link href={`/contest/${contest.id}`} className="inline-flex items-center rounded-full bg-red-600 px-5 py-3 text-white font-bold hover:bg-red-700 transition-colors">
                                        Xem chi tiết
                                    </Link>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
                {contests.length === 0 && (
                    <div className="text-center py-20 text-slate-500">Hiện chưa có cuộc thi nào đang hiển thị.</div>
                )}
            </section>
        </main>
    );
};

export default Page;