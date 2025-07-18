import { apiArticleList } from "@/services/article";
import { ActionType, PageContainer, ProTable } from "@ant-design/pro-components"
import NewArticle from "./components/new";
import { useRef } from "react";
import { Button, Dropdown } from "antd";
import { EditOutlined, MoreOutlined } from "@ant-design/icons";
import { history } from "@umijs/max";

const Index: React.FC = () => {

    const actionRef = useRef<ActionType>(null);


    return (
        <PageContainer extra={<NewArticle reload={actionRef.current?.reload} />}>
            <ProTable
                actionRef={actionRef}
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
                        ellipsis: true
                    },
                    {
                        title: 'Ngày tạo',
                        dataIndex: 'createdDate',
                        valueType: 'fromNow',
                        search: false,
                        width: 150
                    },
                    {
                        title: 'Tác giả',
                        dataIndex: 'createdBy',
                        search: false,
                        width: 120
                    },
                    {
                        title: 'Lượt xem',
                        dataIndex: 'viewCount',
                        valueType: 'digit',
                        search: false,
                        width: 90
                    },
                    {
                        title: 'Trạng thái',
                        dataIndex: 'isActive',
                        valueEnum: {
                            false: { text: 'Bản nháp', status: 'Default' },
                            true: { text: 'Xuất bản', status: 'Success' }
                        },
                        width: 100
                    },
                    {
                        title: 'Tác vụ',
                        valueType: 'option',
                        render: (_, record) => [
                            <Dropdown key="more" menu={{
                                items: [
                                    {
                                        key: 'edit',
                                        label: 'Chỉnh sửa',
                                        icon: <EditOutlined />,
                                        onClick: () => {
                                            history.push(`/article/center/${record.id}`);
                                        }
                                    }
                                ]
                            }}>
                                <Button type="dashed" icon={<MoreOutlined />} size="small" />
                            </Dropdown>
                        ],
                        width: 60
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