import Breadcrumb from "@/app/components/breadcrumb";

const Loading: React.FC = () => {
    return (
        <main>
            <Breadcrumb title="Tin tức" items={[
                { label: "Tin tức", href: "/article" },
                { label: "Đang tải...", href: "/article" },
            ]} />

            <section className="container mx-auto px-4 md:px-0 py-10 md:py-16">
                <div className="mx-auto bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden animate-pulse">
                    <div className="h-64 md:h-[420px] bg-slate-200" />

                    <div className="p-6 md:p-10">
                        <div className="h-10 bg-slate-200 rounded-xl w-3/4" />
                        <div className="mt-4 h-4 bg-slate-200 rounded w-1/3" />
                        <div className="mt-8 space-y-3">
                            <div className="h-4 bg-slate-200 rounded" />
                            <div className="h-4 bg-slate-200 rounded" />
                            <div className="h-4 bg-slate-200 rounded w-5/6" />
                            <div className="h-4 bg-slate-200 rounded" />
                            <div className="h-4 bg-slate-200 rounded w-4/6" />
                        </div>
                    </div>
                </div>

                <div className="mx-auto mt-10 animate-pulse">
                    <div className="h-7 bg-slate-200 rounded w-56 mb-5" />
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                                <div className="h-40 bg-slate-200" />
                                <div className="p-4">
                                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                                    <div className="mt-3 h-4 bg-slate-200 rounded" />
                                    <div className="mt-2 h-4 bg-slate-200 rounded w-5/6" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
};

export default Loading;
