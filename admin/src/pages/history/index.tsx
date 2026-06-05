import { apiHistoryList } from "@/services/history";
import { PageContainer, ProTable } from "@ant-design/pro-components"

const Index: React.FC = () => {
    return (
        <PageContainer>
            <ProTable
                request={apiHistoryList}
                rowKey="id"
                columns={[
                    {
                        title: '#',
                        valueType: 'indexBorder',
                        width: 30,
                        align: 'center',
                    },
                    {
                        title: 'Tài khoản',
                        dataIndex: 'userName',
                        width: 150,
                    },
                    {
                        title: 'Thời gian',
                        dataIndex: 'createdAt',
                        valueType: 'dateTime',
                        width: 180,
                        search: false,
                    },
                    {
                        title: 'Hành động',
                        dataIndex: 'message',
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