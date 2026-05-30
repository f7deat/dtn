"use client";

import Breadcrumb from "@/app/components/breadcrumb";
import { getCurrentUser } from "@/app/services/auth";
import {
    apiContestGet,
    apiContestMySubmissions,
    apiContestSubmit,
} from "@/app/services/contest";
import { Alert, Input, Spin, notification } from "antd";
import dayjs from "dayjs";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

function isValidPhoneNumber(value: string) {
    const normalizedValue = value.trim().replace(/[\s().-]/g, "");
    return /^\+?\d{9,15}$/.test(normalizedValue);
}

const Page: React.FC = () => {
    const params = useParams<{ id: string }>();
    const [api, contextHolder] = notification.useNotification();
    const [contest, setContest] = useState<API.ContestListItem | null>(null);
    const [submissions, setSubmissions] = useState<API.ContestSubmissionItem[]>([]);
    const [currentUser, setCurrentUser] = useState<API.CurrentUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [note, setNote] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const contestId = typeof params?.id === "string" ? params.id : "";

    useEffect(() => {
        const loadData = async () => {
            if (!contestId) {
                return;
            }

            setLoading(true);
            try {
                const [contestData, user] = await Promise.all([
                    apiContestGet(contestId),
                    getCurrentUser(),
                ]);
                setContest(contestData);
                setCurrentUser(user);

                if (user) {
                    const mySubmissions = await apiContestMySubmissions(contestId);
                    setSubmissions(mySubmissions);
                }
            } finally {
                setLoading(false);
            }
        };

        void loadData();
    }, [contestId]);

    const onSubmit = async () => {
        if (!contestId || !contest) {
            return;
        }

        if (!currentUser) {
            window.location.href = `/login?redirect=${encodeURIComponent(`/contest/${contestId}`)}`;
            return;
        }

        if (!contest.isOpened) {
            api.warning({
                message: "Cuộc thi hiện chưa trong thời gian nhận bài.",
            });
            return;
        }

        if (!selectedFile) {
            api.error({
                message: "Vui lòng chọn file PDF để nộp bài.",
            });
            return;
        }

        if (!selectedFile.name.toLowerCase().endsWith(".pdf")) {
            api.error({
                message: "Chỉ hỗ trợ file PDF.",
            });
            return;
        }
        if (!note.trim()) {
            api.error({
                message: "Vui lòng nhập số điện thoại liên hệ.",
            });
            return;
        }

        if (!isValidPhoneNumber(note)) {
            api.error({
                message: "Số điện thoại không hợp lệ.",
                description: "Vui lòng nhập số điện thoại gồm 9 đến 15 chữ số, có thể bắt đầu bằng dấu +.",
            });
            return;
        }

        setSubmitting(true);
        try {
            const response = await apiContestSubmit(contestId, selectedFile, note.trim());
            if (response?.succeeded === false) {
                api.error({
                    message: response?.message ?? "Nộp bài thất bại.",
                });
                return;
            }

            const [mySubmissions, latestContest] = await Promise.all([
                apiContestMySubmissions(contestId),
                apiContestGet(contestId),
            ]);
            setSubmissions(mySubmissions);
            setContest(latestContest);
            setSelectedFile(null);
            setNote("");
            api.success({
                message: "Nộp bài thành công.",
                description: "Hệ thống đã ghi nhận một bài nộp mới của bạn.",
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <main>
                <Breadcrumb title="Chi tiết cuộc thi" items={[
                    { label: "Cuộc thi", href: "/contest" },
                    { label: "Chi tiết", href: "/contest" },
                ]} />
                <div className="container mx-auto px-4 md:px-0 py-16 text-center">
                    <Spin size="large" />
                </div>
            </main>
        );
    }

    if (!contest) {
        return (
            <main>
                <Breadcrumb title="Cuộc thi không tồn tại" items={[
                    { label: "Cuộc thi", href: "/contest" },
                    { label: "Không tìm thấy", href: "/contest" },
                ]} />
                <div className="container mx-auto px-4 md:px-0 py-16 text-center text-slate-500">
                    Không tìm thấy cuộc thi hoặc cuộc thi đã bị ẩn.
                </div>
            </main>
        );
    }

    return (
        <main>
            {contextHolder}
            <Breadcrumb title={contest.title} items={[
                { label: "Cuộc thi", href: "/contest" },
                { label: contest.title, href: `/contest/${contest.id}` },
            ]} />

            <section className="container mx-auto px-4 md:px-0 py-10 md:py-16">
                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)] gap-8">
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-[linear-gradient(135deg,#991b1b_0%,#ef4444_40%,#f59e0b_100%)] px-8 py-8 text-white">
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                <span className="rounded-full bg-white/20 px-4 py-2 text-xs uppercase tracking-[0.3em] font-bold">Student Contest</span>
                                <span className={`rounded-full px-4 py-2 text-sm font-bold ${contest.isOpened ? "bg-white text-red-700" : contest.hasEnded ? "bg-black/20 text-white" : "bg-amber-100 text-amber-900"}`}>
                                    {contest.isOpened ? "Đang nhận bài" : contest.hasEnded ? "Đã kết thúc" : "Sắp mở"}
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold leading-tight">{contest.title}</h1>
                            <p className="mt-4 text-white/90 text-lg leading-8">{contest.description || "Hãy đọc kỹ thể lệ và nộp bài đúng định dạng PDF trong thời gian quy định."}</p>
                        </div>

                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                <div className="rounded-3xl bg-slate-50 p-5">
                                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold">Bắt đầu</div>
                                    <div className="mt-2 text-xl font-bold text-slate-900">{dayjs(contest.startDate).format("DD/MM/YYYY")}</div>
                                </div>
                                <div className="rounded-3xl bg-slate-50 p-5">
                                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold">Kết thúc</div>
                                    <div className="mt-2 text-xl font-bold text-slate-900">{dayjs(contest.endDate).format("DD/MM/YYYY")}</div>
                                </div>
                                <div className="rounded-3xl bg-slate-50 p-5">
                                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold">Bài dự thi</div>
                                    <div className="mt-2 text-xl font-bold text-slate-900">{contest.submissionCount}</div>
                                </div>
                            </div>

                            {contest.content ? (
                                <div className="max-w-none text-slate-700 leading-8" dangerouslySetInnerHTML={{ __html: contest.content }} />
                            ) : (
                                <div className="text-slate-500 leading-7">Ban tổ chức chưa cập nhật nội dung chi tiết cho cuộc thi này.</div>
                            )}
                        </div>
                    </div>

                    <aside className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 md:p-8 h-fit">
                        <div className="text-sm uppercase tracking-[0.3em] text-red-700 font-bold">Nộp bài</div>
                        <h2 className="text-2xl font-bold text-slate-900 mt-3">Bài dự thi của bạn</h2>
                        <p className="text-slate-500 leading-7 mt-3">Đăng nhập để nộp file PDF. Mỗi lần nộp sẽ tạo một bài dự thi mới và bạn có thể thêm ghi chú.</p>

                        {!currentUser && (
                            <Alert
                                className="mt-6"
                                type="warning"
                                showIcon
                                message="Bạn cần đăng nhập bằng tài khoản sinh viên để nộp bài."
                            />
                        )}

                        {submissions.length > 0 && (
                            <div className="mt-6 rounded-3xl bg-emerald-50 border border-emerald-200 p-5">
                                <div className="text-sm font-bold text-emerald-700 uppercase">Các bài đã nộp ({submissions.length})</div>
                                <div className="mt-3 space-y-3 max-h-64 overflow-auto pr-1">
                                    {submissions.map((submission, index) => (
                                        <div key={submission.id} className="rounded-2xl border border-emerald-200 bg-white p-3">
                                            <a href={submission.fileUrl} target="_blank" rel="noreferrer" className="block text-sm font-bold text-slate-900 hover:text-red-600">
                                                {index + 1}. {submission.originalFileName}
                                            </a>
                                            <div className="mt-2">
                                                {submission.status === 1 && <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Đã duyệt</span>}
                                                {submission.status === 2 && <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">Bị từ chối</span>}
                                                {submission.status === 0 && <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">Chờ duyệt</span>}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1">Nộp lúc {dayjs(submission.submittedAt).format("DD/MM/YYYY HH:mm")}</div>
                                            {submission.note && <div className="text-sm text-slate-700 mt-2">Ghi chú: {submission.note}</div>}
                                            {submission.adminNote && <div className="text-sm text-red-700 mt-2">Phản hồi quản trị: {submission.adminNote}</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Chọn file PDF</label>
                                <input
                                    type="file"
                                    accept="application/pdf,.pdf"
                                    onChange={(event) => {
                                        const file = event.target.files?.[0] ?? null;
                                        setSelectedFile(file);
                                    }}
                                    className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-red-50 file:px-4 file:py-3 file:font-bold file:text-red-700 hover:file:bg-red-100"
                                />
                                {selectedFile && <div className="mt-2 text-sm text-slate-500">Đã chọn: {selectedFile.name}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Số điện thoại</label>
                                <Input
                                    type="tel"
                                    inputMode="tel"
                                    autoComplete="tel"
                                    placeholder="0912345678"
                                    value={note}
                                    onChange={(event) => setNote(event.target.value)}
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => void onSubmit()}
                                disabled={submitting || !contest.isOpened}
                                className="w-full rounded-full bg-red-600 px-6 py-4 text-white font-bold hover:bg-red-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                            >
                                {submitting ? "Đang nộp bài..." : "Nộp bài dự thi"}
                            </button>
                        </div>

                        <div className="mt-6 text-sm text-slate-500 leading-7">
                            File hợp lệ: PDF. Mỗi lần nộp sẽ tạo một bản ghi bài dự thi mới cho sinh viên.
                        </div>
                    </aside>
                </div>
            </section>
        </main>
    );
};

export default Page;