import {
    apiContestCreate,
    apiContestDelete,
    apiContestList,
    apiContestUpdate,
} from "@/services/contest";
import MyCkEditor from "@/components/ckeditor/MyCkEditor";
import {
    DeleteOutlined,
    EditOutlined,
    PlusOutlined,
} from "@ant-design/icons";
import {
    ActionType,
    ModalForm,
    PageContainer,
    ProFormDatePicker,
    ProFormInstance,
    ProFormRadio,
    ProFormText,
    ProFormTextArea,
    ProTable,
} from "@ant-design/pro-components";
import { history } from "@umijs/max";
import { Button, message, Popconfirm, Tag } from "antd";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";

interface ContestItem {
    id: string;
    title: string;
    description?: string;
    content?: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    isOpened: boolean;
    hasEnded: boolean;
    submissionCount: number;
    createdDate?: string;
}

const Index: React.FC = () => {
    const actionRef = useRef<ActionType>(null);
    const formRef = useRef<ProFormInstance>(null);

    const [editingContest, setEditingContest] = useState<ContestItem>();
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        if (editingContest && formRef.current) {
            formRef.current.setFieldsValue({
                title: editingContest.title,
                description: editingContest.description,
                content: editingContest.content,
                startDate: dayjs(editingContest.startDate),
                endDate: dayjs(editingContest.endDate),
                isActive: editingContest.isActive,
            });
            return;
        }

        formRef.current?.resetFields();
    }, [editingContest, modalOpen]);

    const onFinish = async (values: any) => {
        const payload = {
            ...values,
            startDate: dayjs(values.startDate).format("YYYY-MM-DD"),
            endDate: dayjs(values.endDate).format("YYYY-MM-DD"),
        };

        if (editingContest) {
            await apiContestUpdate({ ...payload, id: editingContest.id });
            message.success("Cập nhật cuộc thi thành công");
        } else {
            await apiContestCreate(payload);
            message.success("Tạo cuộc thi thành công");
        }

        setModalOpen(false);
        setEditingContest(undefined);
        actionRef.current?.reload();
        return true;
    };

    return (
        <PageContainer
            extra={
                <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                    setEditingContest(undefined);
                    setModalOpen(true);
                }}>
                    Tạo cuộc thi
                </Button>
            }
        >
            <ProTable<ContestItem>
                actionRef={actionRef}
                rowKey="id"
                request={apiContestList}
                search={{ layout: "vertical" }}
                columns={[
                    {
                        title: "#",
                        valueType: "indexBorder",
                        width: 48,
                    },
                    {
                        title: "Cuộc thi",
                        dataIndex: "title",
                        render: (text, record) => (
                            <div>
                                <div className="font-medium mb-1">{text}</div>
                                <div className="text-gray-500 text-sm line-clamp-2">{record.description ?? "Không có mô tả"}</div>
                            </div>
                        ),
                    },
                    {
                        title: "Bắt đầu",
                        dataIndex: "startDate",
                        valueType: "date",
                        search: false,
                        width: 110,
                    },
                    {
                        title: "Kết thúc",
                        dataIndex: "endDate",
                        valueType: "date",
                        search: false,
                        width: 110,
                    },
                    {
                        title: "Bài dự thi",
                        dataIndex: "submissionCount",
                        valueType: "digit",
                        search: false,
                        width: 110,
                        render: (text) => <Tag color="processing">{text}</Tag>,
                    },
                    {
                        title: "Trạng thái",
                        dataIndex: "isActive",
                        valueEnum: {
                            true: { text: "Đang bật", status: "Success" },
                            false: { text: "Tạm dừng", status: "Default" },
                        },
                        width: 120,
                    },
                    {
                        title: "Nhận bài",
                        dataIndex: "isOpened",
                        search: false,
                        width: 120,
                        render: (_, record) => {
                            if (!record.isActive) {
                                return <Tag color="default">Tạm dừng</Tag>;
                            }
                            if (record.isOpened) {
                                return <Tag color="success">Đang mở</Tag>;
                            }
                            if (record.hasEnded) {
                                return <Tag color="error">Đã kết thúc</Tag>;
                            }
                            return <Tag color="gold">Sắp mở</Tag>;
                        },
                    },
                    {
                        title: "Tác vụ",
                        valueType: "option",
                        width: 180,
                        render: (_, record) => [
                            <Button key="manage" type="primary" size="small" onClick={() => history.push(`/contest/center/${record.id}`)}>
                                Bài dự thi
                            </Button>,
                            <Button key="edit" size="small" icon={<EditOutlined />} onClick={() => {
                                setEditingContest(record);
                                setModalOpen(true);
                            }} />,
                            <Popconfirm
                                key="delete"
                                title="Xóa cuộc thi này?"
                                description="Toàn bộ bài dự thi đã nộp cũng sẽ bị xóa."
                                onConfirm={async () => {
                                    await apiContestDelete(record.id);
                                    message.success("Đã xóa cuộc thi");
                                    actionRef.current?.reload();
                                }}
                            >
                                <Button danger size="small" type="primary" icon={<DeleteOutlined />} />
                            </Popconfirm>,
                        ],
                    },
                ]}
            />

            <ModalForm
                title={editingContest ? "Cập nhật cuộc thi" : "Tạo cuộc thi"}
                formRef={formRef}
                open={modalOpen}
                onOpenChange={(open) => {
                    setModalOpen(open);
                    if (!open) {
                        setEditingContest(undefined);
                    }
                }}
                onFinish={onFinish}
            >
                <ProFormText
                    name="title"
                    label="Tên cuộc thi"
                    rules={[{ required: true, message: "Vui lòng nhập tên cuộc thi" }]}
                />
                <ProFormTextArea name="description" label="Mô tả ngắn" />
                <MyCkEditor name="content" label="Nội dung cuộc thi" />
                <ProFormDatePicker
                    name="startDate"
                    label="Ngày bắt đầu"
                    rules={[{ required: true, message: "Vui lòng chọn ngày bắt đầu" }]}
                />
                <ProFormDatePicker
                    name="endDate"
                    label="Ngày kết thúc"
                    rules={[{ required: true, message: "Vui lòng chọn ngày kết thúc" }]}
                />
                <ProFormRadio.Group
                    name="isActive"
                    label="Trạng thái"
                    initialValue={true}
                    options={[
                        { label: "Bật nhận bài", value: true },
                        { label: "Tạm dừng", value: false },
                    ]}
                    rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
                />
            </ModalForm>
        </PageContainer>
    );
};

export default Index;