import { apiCategoryCreate, apiCategoryDelete, apiCategoryList, apiCategoryUpdate } from "@/services/category";
import { DeleteOutlined, MoreOutlined, PlusOutlined } from "@ant-design/icons";
import { ActionType, ModalForm, PageContainer, ProFormInstance, ProFormText, ProTable } from "@ant-design/pro-components"
import { Button, Dropdown, message, Popconfirm } from "antd";
import { useEffect, useRef, useState } from "react";

const Index: React.FC = () => {

    const actionRef = useRef<ActionType>(null);
    const formRef = useRef<ProFormInstance>(null);
    const [category, setCategory] = useState<any>();
    const [open, setOpen] = useState<boolean>(false);

    useEffect(() => {
        if (category && formRef.current) {
            formRef.current.setFieldsValue({
                name: category.name
            });
        }
    }, [category]);

    const onFinish = async (values: any) => {
        if (category) {
            values.id = category.id;
            await apiCategoryUpdate(values);
        } else {
            await apiCategoryCreate(values);
        }
        message.success(category ? 'Cập nhật danh mục thành công' : 'Thêm danh mục thành công');
        actionRef.current?.reload();
        formRef.current?.resetFields();
        setOpen(false);
    }

    const onDelete = async (id: number) => {
        await apiCategoryDelete(id);
        actionRef.current?.reload();
        message.success('Xóa danh mục thành công');
    }

    return (
        <PageContainer extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>Thêm danh mục</Button>}>
            <ProTable request={apiCategoryList} actionRef={actionRef}
                search={{
                    layout: 'vertical'
                }}
                rowKey="id"
                columns={[
                    {
                        title: '#',
                        valueType: 'indexBorder',
                        width: 30,
                    },
                    {
                        title: 'Tên danh mục',
                        dataIndex: 'name'
                    },
                    {
                        title: 'Bài viết',
                        dataIndex: 'articleCount',
                        valueType: 'digit',
                        search: false,
                        width: 100
                    },
                    {
                        title: 'Tác vụ',
                        valueType: 'option',
                        render: (text, record) => [
                            <Dropdown key="more" menu={{
                                items: [
                                    {
                                        key: 'edit',
                                        label: 'Sửa',
                                        onClick: () => {
                                            setCategory(record);
                                            setOpen(true);
                                        }
                                    },
                                    {
                                        key: 'delete',
                                        label: 'Xóa',
                                        danger: true,
                                        onClick: () => onDelete(record.id)
                                    }
                                ]
                            }}
                            >
                                <Button type="dashed" size="small" icon={<MoreOutlined />} />
                            </Dropdown>,
                            <Popconfirm key="delete" title="Bạn có chắc chắn muốn xóa?" onConfirm={() => onDelete(record.id)}>
                                <Button type="primary" danger size="small" icon={<DeleteOutlined />} />
                            </Popconfirm>
                        ],
                        width: 60
                    }
                ]}
            />
            <ModalForm title={category ? 'Cập nhật danh mục' : 'Thêm danh mục'} formRef={formRef} onFinish={onFinish} open={open} onOpenChange={setOpen}>
                <ProFormText name="name" label="Tên danh mục" rules={[
                    {
                        required: true,
                        message: 'Vui lòng nhập tên danh mục'
                    }
                ]} />
            </ModalForm>
        </PageContainer>
    )
}

export default Index;