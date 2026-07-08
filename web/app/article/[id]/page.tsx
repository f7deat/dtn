/* eslint-disable @next/next/no-img-element */
import Breadcrumb from "@/app/components/breadcrumb";
import { apiArticleGetBySlug, apiArticleList } from "@/app/services/article";
import dayjs from "dayjs";
import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";

type Props = {
    params: Promise<{ id: string }>;
};

const getArticleBySlug = cache(async (normalizedName: string): Promise<API.ArticleDetail | null> => {
    const response = await apiArticleGetBySlug(normalizedName);
    return response?.data?.data ?? null;
});

const getRelatedArticles = cache(async (normalizedName: string): Promise<API.ArticleListItem[]> => {
    const response = await apiArticleList({ current: 1, pageSize: 8 });
    const items: API.ArticleListItem[] = response?.data?.data ?? [];
    return items.filter((item) => item.normalizedName !== normalizedName).slice(0, 4);
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const normalizedName = decodeURIComponent(id ?? "");
    const article = await getArticleBySlug(normalizedName);

    if (!article) {
        return {
            title: "Tin tức | Không tìm thấy bài viết",
            description: "Bài viết không tồn tại hoặc đã bị ẩn.",
            robots: {
                index: false,
                follow: true,
            },
        };
    }

    const pageUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://dtn.dhhp.edu.vn"}/article/${encodeURIComponent(normalizedName)}`;
    const description = article.description || "Chi tiết bài viết từ Đoàn Thanh niên Trường Đại học Hải Phòng.";

    return {
        title: `Tin tức | ${article.title}`,
        description,
        alternates: {
            canonical: pageUrl,
        },
        openGraph: {
            title: article.title,
            description,
            url: pageUrl,
            type: "article",
            images: article.thumbnail
                ? [
                    {
                        url: article.thumbnail,
                        alt: article.title,
                    },
                ]
                : undefined,
        },
        twitter: {
            card: article.thumbnail ? "summary_large_image" : "summary",
            title: article.title,
            description,
            images: article.thumbnail ? [article.thumbnail] : undefined,
        },
    };
}

const Page = async ({ params }: Props) => {
    const { id } = await params;
    const normalizedName = decodeURIComponent(id ?? "");

    const [article, relatedArticles] = await Promise.all([
        getArticleBySlug(normalizedName),
        getRelatedArticles(normalizedName),
    ]);

    if (!article) {
        return (
            <main>
                <Breadcrumb title="Tin tức" items={[
                    { label: "Tin tức", href: "/article" },
                    { label: "Không tìm thấy", href: "/article" },
                ]} />
                <section className="container mx-auto px-4 md:px-0 py-16 text-center">
                    <div className="text-2xl font-bold text-slate-800">Không tìm thấy bài viết</div>
                    <p className="mt-3 text-slate-500">Bài viết có thể đã bị ẩn hoặc không còn tồn tại.</p>
                    <Link href="/article" className="inline-block mt-6 rounded-full bg-red-600 px-6 py-3 text-white font-bold hover:bg-red-700 transition-colors">
                        Quay lại danh sách tin tức
                    </Link>
                </section>
            </main>
        );
    }

    return (
        <main>
            <Breadcrumb title={article.title} items={[
                { label: "Tin tức", href: "/article" },
                { label: article.title, href: `/article/${id}` },
            ]} />

            <section className="container mx-auto px-4 md:px-0 py-10 md:py-16">
                <article className="mx-auto max-w-7xl bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                    {article.thumbnail && (
                        <div className="h-64 md:h-[420px] bg-slate-100">
                            <img
                                src={article.thumbnail}
                                alt={article.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    <div className="p-6 md:p-10">
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
                            {article.title}
                        </h1>

                        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                            {article.createdDate && (
                                <span>
                                    Đăng ngày {dayjs(article.createdDate).format("DD/MM/YYYY HH:mm")}
                                </span>
                            )}
                            <span className="text-slate-300">|</span>
                            <span>{article.viewCount} lượt xem</span>
                        </div>

                        {article.description && (
                            <p className="text-lg text-slate-700 leading-8 font-semibold mt-4">
                                {article.description}
                            </p>
                        )}

                        {article.content ? (
                            <div
                                className=" prose prose-slate max-w-none"
                                dangerouslySetInnerHTML={{ __html: article.content }}
                            />
                        ) : (
                            <p className="mt-8 text-slate-500">Bài viết chưa có nội dung chi tiết.</p>
                        )}
                    </div>
                </article>

                <div className="mx-auto mt-10">
                    <div className="flex items-center justify-between gap-4 mb-5">
                        <h2 className="text-2xl font-bold text-slate-900">Bài viết liên quan</h2>
                        <Link href="/article" className="text-sm font-bold text-red-600 hover:text-red-700">
                            Xem tất cả
                        </Link>
                    </div>

                    {relatedArticles.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-slate-500">
                            Chưa có bài viết liên quan.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            {relatedArticles.map((item) => (
                                <article key={item.normalizedName} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    <Link href={`/article/${item.normalizedName}`} className="block h-40 bg-slate-100">
                                        {item.thumbnail ? (
                                            <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">Không có ảnh</div>
                                        )}
                                    </Link>

                                    <div className="p-4">
                                        <div className="text-xs text-slate-500 mb-2">
                                            {item.createdDate ? dayjs(item.createdDate).format("DD/MM/YYYY") : ""}
                                        </div>
                                        <Link href={`/article/${item.normalizedName}`} className="line-clamp-2 text-base font-bold text-slate-900 hover:text-red-600">
                                            {item.title}
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
};

export default Page;