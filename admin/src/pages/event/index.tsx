import {
    apiEventCreate,
    apiEventDelete,
    apiEventExport,
    apiEventList,
    apiEventUpdate,
} from "@/services/event";
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
    ProFormDigit,
    ProFormInstance,
    ProFormRadio,
    ProFormSelect,
    ProFormText,
    ProFormTextArea,
    ProTable,
} from "@ant-design/pro-components";
import { history } from "@umijs/max";
import { Button, message, Popconfirm, Tag, Row, Col } from "antd";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { apiAcademicYearOptions } from "@/services/academic-year";
import { apiSemesterOptions } from "@/services/semester";

interface EventItem {
    id: string;
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    numberOfDays: number;
    registrationCount: number;
    checkedInCount: number;
    checkedOutCount: number;
    eventType: 0 | 1; // 0 = Limited, 1 = Public
    academicYearId?: number;
    semesterId?: number;
    semesterName?: string;
}

const Index: React.FC = () => {
    const eventActionRef = useRef<ActionType>(null);
    const eventFormRef = useRef<ProFormInstance>(null);

    const [editingEvent, setEditingEvent] = useState<EventItem>();
    const [eventModalOpen, setEventModalOpen] = useState(false);

    useEffect(() => {
        if (editingEvent && eventFormRef.current) {
            eventFormRef.current.setFieldsValue({
                title: editingEvent.title,
                description: editingEvent.description,
                startDate: dayjs(editingEvent.startDate),
                endDate: dayjs(editingEvent.endDate),
                numberOfDays: editingEvent.numberOfDays,
                eventType: editingEvent.eventType,
                academicYearId: editingEvent.academicYearId,
                semesterId: editingEvent.semesterId,
            });
        }
        if (!editingEvent) {
            eventFormRef.current?.resetFields();
        }
    }, [editingEvent, eventModalOpen]);

    const openCreateEventModal = () => {
        setEditingEvent(undefined);
        setEventModalOpen(true);
    };

    const openEditEventModal = (event: EventItem) => {
        setEditingEvent(event);
        setEventModalOpen(true);
    };

    const onSubmitEvent = async (values: any) => {
        const { academicYearId: _, ...rest } = values;
        const payload = {
            ...rest,
            startDate: dayjs(values.startDate)?.format("YYYY-MM-DD"),
            endDate: dayjs(values.endDate)?.format("YYYY-MM-DD"),
            numberOfDays: Number(values.numberOfDays) || 1,
        };

        if (editingEvent) {
            await apiEventUpdate({ ...payload, id: editingEvent.id });
            message.success("Cập nhật sự kiện thành công");
        } else {
            await apiEventCreate(payload);
            message.success("Tạo sự kiện thành công");
        }

        setEventModalOpen(false);
        setEditingEvent(undefined);
        eventActionRef.current?.reload();
    };

    return (
        <PageContainer
            extra={
                <Button key="create" type="primary" icon={<PlusOutlined />} onClick={openCreateEventModal}>
                    Tạo sự kiện
                </Button>
            }
        >
            <ProTable<EventItem>
                actionRef={eventActionRef}
                rowKey="id"
                request={apiEventList}
                search={{ layout: "vertical" }}
                columns={[
                    {
                        title: "#",
                        valueType: "indexBorder",
                        width: 48,
                    },
                    {
                        title: "Sự kiện",
                        dataIndex: "title",
                        render: (text, record) => (
                            <div>
                                <div className="font-medium mb-1">{text}</div>
                                <div className="text-gray-500 text-sm line-clamp-2">{record.description}</div>
                            </div>
                        )
                    },
                    {
                        title: 'Kỳ học',
                        dataIndex: 'semesterId',
                        valueType: 'select',
                        request: async () => apiSemesterOptions({}),
                        minWidth: 120,
                        render: (_, record) => record.semesterName ?? "-",
                    },
                    {
                        title: "Số ngày",
                        dataIndex: "numberOfDays",
                        valueType: "digit",
                        search: false,
                        width: 90,
                        render: (text) => (
                            <Tag color="cyan" className="w-full text-center">{text}</Tag>
                        )
                    },
                    {
                        title: "Loại",
                        dataIndex: "eventType",
                        valueEnum: {
                            0: { text: "Giới hạn", status: "Default" },
                            1: { text: "Công khai", status: "Processing" },
                        },
                        search: false,
                        width: 110,
                    },
                    {
                        title: "Bắt đầu",
                        dataIndex: "startDate",
                        valueType: "date",
                        search: false,
                        width: 100,
                    },
                    {
                        title: "Kết thúc",
                        dataIndex: "endDate",
                        valueType: "date",
                        search: false,
                        width: 100,
                    },
                    {
                        title: "Tham gia",
                        dataIndex: "registrationCount",
                        valueType: "digit",
                        search: false,
                        width: 90,
                        render: (text) => (
                            <Tag color="processing" className="w-full text-center">{text}</Tag>
                        )
                    },
                    {
                        title: "Check-in",
                        dataIndex: "checkedInCount",
                        valueType: "digit",
                        search: false,
                        width: 80,
                        render: (text) => (
                            <Tag color="success" className="w-full text-center">{text}</Tag>
                        )
                    },
                    {
                        title: "Check-out",
                        dataIndex: "checkedOutCount",
                        valueType: "digit",
                        search: false,
                        width: 90,
                        render: (text) => (
                            <Tag color="warning" className="w-full text-center">{text}</Tag>
                        )
                    },
                    {
                        title: "Tác vụ",
                        valueType: "option",
                        width: 180,
                        render: (_, record) => [
                            <Button key="manage" size="small" type="primary" onClick={() => history.push(`/event/center/${record.id}`)}>
                                Quản lý
                            </Button>,
                            <Button key="edit" size="small" type="primary" onClick={() => openEditEventModal(record)} icon={<EditOutlined />} />,
                            <Button key={"export"} size="small" onClick={async () => {
                                if (!record.id) return;
                                const blob = await apiEventExport(record.id);
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `check-in-${record.title}.xlsx`;
                                a.click();
                                window.URL.revokeObjectURL(url);
                            }}>
                                Xuất Excel
                            </Button>,
                            <Popconfirm
                                key="delete"
                                title="Xóa sự kiện này?"
                                description="Dữ liệu check-in cũng sẽ bị xóa."
                                onConfirm={async () => {
                                    await apiEventDelete(record.id);
                                    message.success("Đã xóa sự kiện");
                                    eventActionRef.current?.reload();
                                }}
                            >
                                <Button key="delete" size="small" danger icon={<DeleteOutlined />} type="primary" />
                            </Popconfirm>

                        ],
                    },
                ]}
            />

            <ModalForm
                title={editingEvent ? "Cập nhật sự kiện" : "Tạo sự kiện"}
                formRef={eventFormRef}
                open={eventModalOpen}
                onOpenChange={(open) => {
                    setEventModalOpen(open);
                    if (!open) {
                        setEditingEvent(undefined);
                    }
                }}
                onFinish={onSubmitEvent}
            >
                <ProFormText
                    name="title"
                    label="Tên sự kiện"
                    rules={[{ required: true, message: "Vui lòng nhập tên sự kiện" }]}
                />
                <ProFormTextArea name="description" label="Mô tả ngắn" />
                <ProFormRadio.Group
                    name="eventType"
                    label="Loại sự kiện"
                    initialValue={0}
                    options={[
                        { label: "Giới hạn (chỉ sinh viên được thêm)", value: 0 },
                        { label: "Công khai (tất cả sinh viên)", value: 1 },
                    ]}
                    rules={[{ required: true, message: "Vui lòng chọn loại sự kiện" }]}
                />
                <Row gutter={16}>
                    <Col xs={24} md={6}>
                        <ProFormDatePicker
                            name="startDate"
                            label="Ngày bắt đầu" width="lg"
                            rules={[{ required: true, message: "Vui lòng chọn ngày bắt đầu" }]}
                        />
                    </Col>
                    <Col xs={24} md={6}>
                        <ProFormDatePicker
                            name="endDate"
                            label="Ngày kết thúc" width="lg"
                            rules={[{ required: true, message: "Vui lòng chọn ngày kết thúc" }]}
                        />
                    </Col>
                    <Col xs={24} md={6}>
                        <ProFormDigit
                            name="numberOfDays"
                            label="Số ngày"
                            initialValue={1}
                            min={1}
                            max={365}
                            rules={[{ required: true, message: "Vui lòng nhập số ngày" }]}
                        />
                    </Col>
                    <Col xs={24} md={6}>
                        <ProFormSelect
                            name="academicYearId"
                            label="Năm học"
                            showSearch
                            request={apiAcademicYearOptions}
                            rules={[{ required: true, message: "Vui lòng chọn năm học" }]}
                            fieldProps={{
                                onChange: () => {
                                    eventFormRef.current?.setFieldValue("semesterId", undefined);
                                },
                            }}
                        />
                    </Col>
                    <Col xs={24} md={6}>
                        <ProFormSelect
                            name="semesterId"
                            label="Kỳ học"
                            showSearch
                            dependencies={["academicYearId"]}
                            request={async (params) => {
                                if (!params.academicYearId) {
                                    return [];
                                }
                                return apiSemesterOptions({ academicYearId: params.academicYearId });
                            }}
                            rules={[{ required: true, message: "Vui lòng chọn kỳ học" }]}
                        />
                    </Col>
                </Row>
            </ModalForm>
        </PageContainer>
    );
};

export default Index;