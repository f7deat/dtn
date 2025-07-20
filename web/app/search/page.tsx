import Breadcrumb from "../components/breadcrumb"

const Page : React.FC = () => {
    return (
        <main>
            <Breadcrumb title="Tìm kiếm" items={[
                { label: "Tìm kiếm", href: "/search" }
            ]} />
        </main>
    )
}

export default Page;