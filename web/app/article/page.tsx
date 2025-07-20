import Breadcrumb from "../components/breadcrumb"

const Page : React.FC = () => {
    return (
        <main>
            <Breadcrumb title="Tin tức và Sự kiện" items={[
                { label: "Tin tức và Sự kiện", href: "/article" }
            ]} />
        </main>
    )
}

export default Page;