import { apiStudentList } from "@/services/student";
import { ManOutlined, MoreOutlined, WomanOutlined } from "@ant-design/icons";
import { PageContainer, ProTable } from "@ant-design/pro-components"
import { Button, Dropdown } from "antd";

const Index: React.FC = () => {
    return (
        <PageContainer>
            <ProTable
                rowKey="id"
                request={apiStudentList}
                columns={[
                    {
                        title: '#',
                        valueType: 'indexBorder',
                        width: 30
                    },
                    {
                        title: 'Mã sinh viên',
                        dataIndex: 'userName'
                    },
                    {
                        title: 'Họ & tên',
                        dataIndex: 'fullName',
                        render: (text, record) => {
                            if (record.gender === 0) {
                                return <><ManOutlined className="text-blue-500 mr-1" />{text}</>
                            }
                            return <><WomanOutlined className="text-red-500 mr-1" />{text}</>
                        }
                    },
                    {
                        title: 'Ngày sinh',
                        dataIndex: 'dateOfBirth',
                        valueType: 'date',
                        search: false
                    },
                    {
                        title: 'Lớp',
                        dataIndex: 'classCode'
                    },
                    {
                        title: 'Khoa',
                        dataIndex: 'departmentName',
                        search: false
                    },
                    {
                        title: 'Tác vụ',
                        valueType: 'option',
                        render: (text, record) => [
                            <Dropdown key="more" menu={{
                                items: []
                            }}>
                                <Button type="dashed" size="small" icon={<MoreOutlined />}></Button>
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