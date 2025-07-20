import Breadcrumb from "@/app/components/breadcrumb";

const Page : React.FC = () => {
    return (
        <main>
            <Breadcrumb title="Tin tức" items={[
                { label: "Tin tức", href: "/article" }
            ]} />
        </main>
    )
}

export default Page;