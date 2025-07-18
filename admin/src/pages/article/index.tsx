import { apiArticleList } from "@/services/article";
import { PageContainer, ProTable } from "@ant-design/pro-components"
import NewArticle from "./components/new";

const Index: React.FC = () => {
    return (
        <PageContainer extra={<NewArticle />}>
            <ProTable
                request={apiArticleList}
                rowKey="id"
                columns={[
                    {
                        title: '#',
                        valueType: 'indexBorder',
                        width: 30
                    },
                    {
                        title: 'Tiêu đề',
                        dataIndex: 'title',
                        ellipsis: true,
                        copyable: true,
                        width: 300
                    },
                    {
                        title: 'Mô tả',
                        dataIndex: 'description',
                        ellipsis: true,
                        copyable: true,
                    },
                    {
                        title: 'Ngày tạo',
                        dataIndex: 'createdDate',
                        valueType: 'fromNow',
                    }
                ]}
                search={{
                    layout: 'vertical'
                }}
            />
        </PageContainer>
    )
}

export default Index;