import {
    apiEventAddUser,
    apiEventCheckIn,
    apiEventCreate,
    apiEventExport,
    apiEventGenerateQr,
    apiEventList,
    apiEventRemoveUser,
    apiEventUpdate,
    apiEventUserList,
} from "@/services/event";
import { apiStudentList } from "@/services/student";
import {
    CameraOutlined,
    CheckCircleOutlined,
    PlusOutlined,
    QrcodeOutlined,
    TeamOutlined,
    UserDeleteOutlined,
} from "@ant-design/icons";
import {
    ActionType,
    ModalForm,
    PageContainer,
    ProCard,
    ProFormDatePicker,
    ProFormInstance,
    ProFormText,
    ProFormTextArea,
    ProTable,
} from "@ant-design/pro-components";
import { Button, Alert, Descriptions, Input, message, Modal, Popconfirm, QRCode, Space, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface EventItem {
    id: string;
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    registrationCount: number;
    checkedInCount: number;
}

interface EventUserItem {
    id: string;
    userId: string;
    userName: string;
    fullName: string;
    classCode?: string;
    className?: string;
    departmentName?: string;
    checkedInAt?: string;
    checkedInBy?: string;
    isCheckedIn: boolean;
}

interface StudentItem {
    id: number;
    userName: string;
    fullName: string;
    classCode?: string;
    departmentName?: string;
}

const emptyTableResult = {
    data: [],
    success: true,
    total: 0,
};

const Index: React.FC = () => {
    const eventActionRef = useRef<ActionType>(null);
    const userActionRef = useRef<ActionType>(null);
    const eventFormRef = useRef<ProFormInstance>(null);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const scannerInitializedRef = useRef(false);
    const checkInRef = useRef(false);
    const lastScanRef = useRef<{ value: string; at: number; }>({ value: "", at: 0 });

    const [selectedEvent, setSelectedEvent] = useState<EventItem>();
    const [editingEvent, setEditingEvent] = useState<EventItem>();
    const [eventModalOpen, setEventModalOpen] = useState(false);
    const [addUserModalOpen, setAddUserModalOpen] = useState(false);
    const [scannerOpen, setScannerOpen] = useState(false);
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState<StudentItem[]>([]);
    const [selectedStudentKeys, setSelectedStudentKeys] = useState<React.Key[]>([]);
    const [qrLoading, setQrLoading] = useState(false);
    const [qrPayload, setQrPayload] = useState<{ qrCode: string; fullName?: string; userName?: string; }>();
    const [manualQrCode, setManualQrCode] = useState("");
    const [scannerError, setScannerError] = useState<string>();
    const [latestCheckIn, setLatestCheckIn] = useState<any>();

    useEffect(() => {
        if (editingEvent && eventFormRef.current) {
            eventFormRef.current.setFieldsValue({
                title: editingEvent.title,
                description: editingEvent.description,
                startDate: dayjs(editingEvent.startDate),
                endDate: dayjs(editingEvent.endDate),
            });
        }
        if (!editingEvent) {
            eventFormRef.current?.resetFields();
        }
    }, [editingEvent, eventModalOpen]);

    useEffect(() => {
        if (!scannerOpen) {
            stopScanner();
            setScannerError(undefined);
            return;
        }

        void startScanner();
        return () => {
            stopScanner();
        };
    }, [scannerOpen, selectedEvent]);

    const stopScanner = () => {
        if (html5QrCodeRef.current && scannerInitializedRef.current) {
            const scanner = html5QrCodeRef.current;
            try {
                // Check if scanner is actually running before stopping
                const state = scanner.getState();
                if (state === 2) { // 2 = SCANNING state
                    scanner.stop().then(() => {
                        try {
                            scanner.clear();
                        } catch (e) {
                            // Ignore clear errors
                        }
                    }).catch(() => {
                        // Ignore errors when stopping
                    }).finally(() => {
                        html5QrCodeRef.current = null;
                        scannerInitializedRef.current = false;
                    });
                } else {
                    // If not scanning, just clear and reset
                    try {
                        scanner.clear();
                    } catch (e) {
                        // Ignore clear errors
                    }
                    html5QrCodeRef.current = null;
                    scannerInitializedRef.current = false;
                }
            } catch (error) {
                // Handle any errors during state check
                html5QrCodeRef.current = null;
                scannerInitializedRef.current = false;
            }
        } else {
            // Reset refs even if scanner wasn't properly initialized
            html5QrCodeRef.current = null;
            scannerInitializedRef.current = false;
        }
    };

    const handleCheckIn = async (qrCode: string) => {
        if (!selectedEvent || checkInRef.current) {
            return;
        }

        const now = Date.now();
        if (lastScanRef.current.value === qrCode && now - lastScanRef.current.at < 3000) {
            return;
        }

        lastScanRef.current = { value: qrCode, at: now };
        checkInRef.current = true;
        try {
            const response = await apiEventCheckIn({ eventId: selectedEvent.id, qrCode });
            setLatestCheckIn(response);
            setManualQrCode("");
            message.success(`Đã check-in ${response.fullName ?? response.userName ?? "người tham gia"}`);
            userActionRef.current?.reload();
            eventActionRef.current?.reload();
        } finally {
            checkInRef.current = false;
        }
    };

    const startScanner = async () => {
        if (!selectedEvent) {
            setScannerError("Vui lòng chọn sự kiện trước khi quét QR.");
            return;
        }

        try {
            const html5QrCode = new Html5Qrcode("qr-reader");
            html5QrCodeRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                (decodedText) => {
                    void handleCheckIn(decodedText);
                },
                () => {
                    // Ignore scan failures
                }
            );
            scannerInitializedRef.current = true;
        } catch (error) {
            setScannerError("Không thể mở camera. Hãy kiểm tra quyền truy cập hoặc nhập mã QR thủ công.");
            html5QrCodeRef.current = null;
            scannerInitializedRef.current = false;
        }
    };

    const openCreateEventModal = () => {
        setEditingEvent(undefined);
        setEventModalOpen(true);
    };

    const openEditEventModal = (event: EventItem) => {
        setEditingEvent(event);
        setEventModalOpen(true);
    };

    const onSubmitEvent = async (values: any) => {
        const payload = {
            ...values,
            startDate: dayjs(values.startDate)?.format("YYYY-MM-DD"),
            endDate: dayjs(values.endDate)?.format("YYYY-MM-DD"),
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

    const onAddUsers = async () => {
        if (!selectedEvent || selectedStudents.length === 0) {
            return;
        }

        for (const student of selectedStudents) {
            await apiEventAddUser({
                eventId: selectedEvent.id,
                userName: student.userName,
            });
        }

        message.success("Đã thêm người tham gia vào sự kiện");
        setAddUserModalOpen(false);
        setSelectedStudents([]);
        setSelectedStudentKeys([]);
        userActionRef.current?.reload();
        eventActionRef.current?.reload();
    };

    const onRemoveUser = async (user: EventUserItem) => {
        if (!selectedEvent) {
            return;
        }

        await apiEventRemoveUser({
            eventId: selectedEvent.id,
            userId: user.userId,
        });
        message.success("Đã xóa người tham gia khỏi sự kiện");
        userActionRef.current?.reload();
        eventActionRef.current?.reload();
    };

    const onOpenQr = async (user: EventUserItem) => {
        if (!selectedEvent) {
            return;
        }

        setQrModalOpen(true);
        setQrLoading(true);
        try {
            const response = await apiEventGenerateQr({
                eventId: selectedEvent.id,
                userId: user.userId,
            });
            setQrPayload(response);
        } finally {
            setQrLoading(false);
        }
    };

    return (
        <PageContainer
            extra={[
                <Button key="create" type="primary" icon={<PlusOutlined />} onClick={openCreateEventModal}>
                    Tạo sự kiện
                </Button>,
                <Button key="scan" icon={<CameraOutlined />} disabled={!selectedEvent} onClick={() => setScannerOpen(true)}>
                    Quét QR check-in
                </Button>,
            ]}
        >
            <ProCard 
            className="mb-4"
            title="Danh sách sự kiện" extra={selectedEvent ? <Tag color="processing">Đang quản lý: {selectedEvent.title}</Tag> : undefined}>
                <ProTable<EventItem>
                    actionRef={eventActionRef}
                    rowKey="id"
                    request={apiEventList}
                    search={{ layout: "vertical" }}
                    onRow={(record) => ({
                        onClick: () => setSelectedEvent(record),
                    })}
                    columns={[
                        {
                            title: "#",
                            valueType: "indexBorder",
                            width: 48,
                        },
                        {
                            title: "Sự kiện",
                            dataIndex: "title",
                        },
                        {
                            title: "Bắt đầu",
                            dataIndex: "startDate",
                            valueType: "date",
                            search: false,
                            width: 120,
                        },
                        {
                            title: "Kết thúc",
                            dataIndex: "endDate",
                            valueType: "date",
                            search: false,
                            width: 120,
                        },
                        {
                            title: "Người tham gia",
                            dataIndex: "registrationCount",
                            valueType: "digit",
                            search: false,
                            width: 130,
                        },
                        {
                            title: "Đã check-in",
                            dataIndex: "checkedInCount",
                            valueType: "digit",
                            search: false,
                            width: 120,
                        },
                        {
                            title: "Tác vụ",
                            valueType: "option",
                            width: 140,
                            render: (_, record) => [
                                <Button key="manage" size="small" type={selectedEvent?.id === record.id ? "primary" : "default"} onClick={() => setSelectedEvent(record)}>
                                    Quản lý
                                </Button>,
                                <Button key="edit" size="small" onClick={() => openEditEventModal(record)}>
                                    Sửa
                                </Button>,
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
                                </Button>

                            ],
                        },
                    ]}
                />
            </ProCard>

            <div className="md:flex gap-4">
                <div className="md:w-2/5 mb-4">
                    <ProCard
                        title="Phiên check-in"
                        extra={<Button icon={<TeamOutlined />} disabled={!selectedEvent} onClick={() => setAddUserModalOpen(true)}>Thêm người tham gia</Button>}
                    >
                        {selectedEvent ? (
                            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                                <Descriptions size="small" column={1} bordered>
                                    <Descriptions.Item label="Sự kiện">{selectedEvent.title}</Descriptions.Item>
                                    <Descriptions.Item label="Thời gian">
                                        {dayjs(selectedEvent.startDate).format("DD/MM/YYYY")} - {dayjs(selectedEvent.endDate).format("DD/MM/YYYY")}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Tiến độ">
                                        <Tag color="blue">{selectedEvent.checkedInCount}/{selectedEvent.registrationCount} đã check-in</Tag>
                                    </Descriptions.Item>
                                </Descriptions>

                                <Alert
                                    type="info"
                                    showIcon
                                    message="Luồng check-in"
                                    description="Mỗi người tham gia được lấy QR theo từng sự kiện. Người quản lý có thể quét bằng camera hoặc dán mã QR vào ô nhập tay."
                                />

                                {latestCheckIn ? (
                                    <Alert
                                        type="success"
                                        showIcon
                                        icon={<CheckCircleOutlined />}
                                        message={`Vừa check-in: ${latestCheckIn.fullName ?? latestCheckIn.userName}`}
                                        description={`Thời gian: ${dayjs(latestCheckIn.checkedInAt).format("HH:mm DD/MM/YYYY")}`}
                                    />
                                ) : null}

                                <Button type="primary" icon={<CameraOutlined />} onClick={() => setScannerOpen(true)}>
                                    Mở camera quét QR
                                </Button>
                            </Space>
                        ) : (
                            <Alert type="warning" showIcon message="Chưa chọn sự kiện" description="Hãy chọn một sự kiện ở bảng phía trên để quản lý người tham gia và check-in." />
                        )}
                    </ProCard>
                </div>

                <ProCard title="Người tham gia">
                    <ProTable<EventUserItem>
                        actionRef={userActionRef}
                        rowKey="userId"
                        search={{ layout: "vertical" }}
                        params={{ eventId: selectedEvent?.id }}
                        request={async (params) => {
                            if (!selectedEvent) {
                                return emptyTableResult;
                            }
                            return apiEventUserList({ ...params, eventId: selectedEvent.id });
                        }}
                        toolBarRender={() => [
                            <Button key="add-user" icon={<PlusOutlined />} disabled={!selectedEvent} onClick={() => setAddUserModalOpen(true)}>
                                Thêm người tham gia
                            </Button>,
                            <Button key="scan-inline" type="primary" icon={<CameraOutlined />} disabled={!selectedEvent} onClick={() => setScannerOpen(true)}>
                                Quét QR
                            </Button>,
                        ]}
                        ghost
                        columns={[
                            {
                                title: "Mã SV",
                                dataIndex: "userName",
                            },
                            {
                                title: "Họ và tên",
                                dataIndex: "name",
                                search: false
                            },
                            {
                                title: "Lớp",
                                dataIndex: "classCode",
                                search: false
                            },
                            {
                                title: "Khoa",
                                dataIndex: "departmentName",
                                search: false,
                            },
                            {
                                title: "Trạng thái",
                                dataIndex: "isCheckedIn",
                                valueEnum: {
                                    false: { text: "Chưa check-in", status: "Default" },
                                    true: { text: "Đã check-in", status: "Success" },
                                },
                                width: 130,
                            },
                            {
                                title: "Thời gian vào",
                                dataIndex: "checkedInAt",
                                valueType: "dateTime",
                                search: false,
                                width: 180,
                            },
                            {
                                title: "Người xác nhận",
                                dataIndex: "checkedInBy",
                                search: false,
                                width: 150,
                            },
                            {
                                title: "Tác vụ",
                                valueType: "option",
                                render: (_, record) => [
                                    <Button hidden key="qr" size="small" icon={<QrcodeOutlined />} onClick={() => void onOpenQr(record)}>
                                        QR
                                    </Button>,
                                    <Popconfirm key="remove" title="Xóa người này khỏi sự kiện?" onConfirm={() => void onRemoveUser(record)}>
                                        <Button size="small" danger icon={<UserDeleteOutlined />}>
                                            Xóa
                                        </Button>
                                    </Popconfirm>,
                                ],
                            },
                        ]}
                    />
                </ProCard>
            </div>

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
            </ModalForm>

            <Modal
                title="Thêm người tham gia"
                open={addUserModalOpen}
                onCancel={() => {
                    setAddUserModalOpen(false);
                    setSelectedStudents([]);
                    setSelectedStudentKeys([]);
                }}
                onOk={() => void onAddUsers()}
                okText="Thêm vào sự kiện"
                width={960}
                okButtonProps={{ disabled: selectedStudents.length === 0 || !selectedEvent }}
            >
                <ProTable<StudentItem>
                    rowKey="userName"
                    request={apiStudentList}
                    search={{ layout: "vertical" }}
                    pagination={{ pageSize: 5 }}
                    rowSelection={{
                        selectedRowKeys: selectedStudentKeys,
                        onChange: (keys, rows) => {
                            setSelectedStudentKeys(keys);
                            setSelectedStudents(rows);
                        },
                    }}
                    columns={[
                        {
                            title: "Mã SV",
                            dataIndex: "userName",
                        },
                        {
                            title: "Họ và tên",
                            dataIndex: "fullName",
                        },
                        {
                            title: "Lớp",
                            dataIndex: "classCode",
                        },
                        {
                            title: "Khoa",
                            dataIndex: "departmentName",
                            search: false,
                        },
                    ]}
                />
            </Modal>

            <Modal
                title="Quét QR check-in"
                open={scannerOpen}
                onCancel={() => setScannerOpen(false)}
                footer={null}
                width={720}
            >
                <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                    {scannerError ? (
                        <Alert type="warning" showIcon message={scannerError} />
                    ) : (
                        <div 
                            id="qr-reader" 
                            style={{ width: "100%", borderRadius: 12, overflow: "hidden" }}
                        />
                    )}

                    <Alert
                        type="info"
                        showIcon
                        message="Nhập mã thủ công"
                        description="Nếu camera không quét được, hãy dán chuỗi QR của người tham gia vào ô bên dưới để check-in."
                    />

                    <Input.Search
                        placeholder="Dán chuỗi QR vào đây"
                        enterButton="Check-in"
                        value={manualQrCode}
                        onChange={(event) => setManualQrCode(event.target.value)}
                        onSearch={(value) => void handleCheckIn(value)}
                    />
                </Space>
            </Modal>

            <Modal
                title="Mã QR người tham gia"
                open={qrModalOpen}
                onCancel={() => {
                    setQrModalOpen(false);
                    setQrPayload(undefined);
                }}
                footer={null}
            >
                <Space direction="vertical" size="middle" align="center" style={{ width: "100%", justifyContent: "center" }}>
                    <Typography.Title level={5} style={{ marginBottom: 0 }}>
                        {qrPayload?.fullName ?? "Đang tải dữ liệu..."}
                    </Typography.Title>
                    <Typography.Text type="secondary">{qrPayload?.userName}</Typography.Text>
                    {qrLoading ? <Typography.Text>Đang tạo QR...</Typography.Text> : null}
                    {qrPayload?.qrCode ? <QRCode value={qrPayload.qrCode} size={240} /> : null}
                    {qrPayload?.qrCode ? <Typography.Paragraph copyable code>{qrPayload.qrCode}</Typography.Paragraph> : null}
                </Space>
            </Modal>
        </PageContainer>
    );
};

export default Index;