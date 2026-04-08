import {
    apiEventAddUser,
    apiEventCheckIn,
    apiEventCreate,
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
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scanFrameRef = useRef<number | null>(null);
    const scanningRef = useRef(false);
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
        scanningRef.current = false;
        if (scanFrameRef.current !== null) {
            window.cancelAnimationFrame(scanFrameRef.current);
            scanFrameRef.current = null;
        }
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        if (videoRef.current) {
            videoRef.current.srcObject = null;
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

        if (typeof BarcodeDetector === "undefined") {
            setScannerError("Trình duyệt hiện tại chưa hỗ trợ quét QR bằng camera. Bạn vẫn có thể nhập mã thủ công ở bên dưới.");
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            setScannerError("Thiết bị không hỗ trợ truy cập camera.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: {
                        ideal: "environment",
                    },
                },
                audio: false,
            });
            streamRef.current = stream;
            if (!videoRef.current) {
                return;
            }

            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            const detector = new BarcodeDetector({ formats: ["qr_code"] });
            scanningRef.current = true;

            const scan = async () => {
                if (!scanningRef.current || !videoRef.current) {
                    return;
                }

                if (videoRef.current.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA && !checkInRef.current) {
                    const codes = await detector.detect(videoRef.current).catch(() => []);
                    const code = codes.find((item) => item.rawValue);
                    if (code?.rawValue) {
                        void handleCheckIn(code.rawValue);
                    }
                }

                scanFrameRef.current = window.requestAnimationFrame(() => {
                    void scan();
                });
            };

            await scan();
        } catch {
            setScannerError("Không thể mở camera. Hãy kiểm tra quyền truy cập hoặc nhập mã QR thủ công.");
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
                userId: String(student.id),
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
            <ProCard title="Danh sách sự kiện" extra={selectedEvent ? <Tag color="processing">Đang quản lý: {selectedEvent.title}</Tag> : undefined}>
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
                            ],
                        },
                    ]}
                />
            </ProCard>

            <ProCard className="mt-4" split="vertical">
                <ProCard
                    title="Phiên check-in"
                    colSpan="32%"
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
                                width: 170,
                                render: (_, record) => [
                                    <Button key="qr" size="small" icon={<QrcodeOutlined />} onClick={() => void onOpenQr(record)}>
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
            </ProCard>

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
                    rowKey="id"
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
                        <video
                            ref={videoRef}
                            muted
                            playsInline
                            style={{ width: "100%", borderRadius: 12, background: "#111827", minHeight: 320, objectFit: "cover" }}
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