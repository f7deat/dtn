import {
    apiEventAddUser,
    apiEventCheckIn,
    apiEventExport,
    apiEventImport,
    apiEventImportTemplate,
    apiEventGenerateQr,
    apiEventGet,
    apiEventRemoveUser,
    apiEventUserList,
} from "@/services/event";
import { apiStudentList } from "@/services/student";
import {
    CameraOutlined,
    CheckCircleOutlined,
    DownloadOutlined,
    FileExcelOutlined,
    LeftOutlined,
    PlusOutlined,
    QrcodeOutlined,
    TeamOutlined,
    UploadOutlined,
    UserDeleteOutlined,
} from "@ant-design/icons";
import { ActionType, PageContainer, ProCard, ProTable } from "@ant-design/pro-components";
import { history, useParams, useRequest } from "@umijs/max";
import { Alert, Button, DatePicker, Descriptions, Input, message, Modal, Popconfirm, QRCode, Radio, Space, Tag, Typography } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";

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
    eventType: 0 | 1;
    semesterId?: number;
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
    checkedOutAt?: string;
    checkedOutBy?: string;
    attendanceDate?: string;
    isCheckedIn: boolean;
    isCheckedOut?: boolean;
    attendanceStatus?: "not-checked-in" | "checked-in" | "checked-out";
}

interface StudentItem {
    id: number;
    userName: string;
    fullName: string;
    classCode?: string;
    departmentName?: string;
}

type AttendanceAction = "check-in" | "check-out";

interface AttendanceScanResult {
    action: AttendanceAction;
    attendanceDate?: string;
    userName?: string;
    fullName?: string;
    classCode?: string;
    className?: string;
    checkedInAt?: string;
    checkedInBy?: string;
    checkedOutAt?: string;
    checkedOutBy?: string;
}

const Index: React.FC = () => {
    const { id = "" } = useParams<{ id: string }>();
    const { data: eventDetail, refresh: refreshEventDetail, loading: eventLoading } = useRequest(() => apiEventGet(id), {
        refreshDeps: [id],
        ready: !!id,
    });

    const userActionRef = useRef<ActionType>(null);
    const importInputRef = useRef<HTMLInputElement>(null);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const scannerInitializedRef = useRef(false);
    const scanRequestRef = useRef(false);
    const lastScanRef = useRef<{ value: string; at: number; }>({ value: "", at: 0 });

    const [addUserModalOpen, setAddUserModalOpen] = useState(false);
    const [scannerOpen, setScannerOpen] = useState(false);
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState<StudentItem[]>([]);
    const [selectedStudentKeys, setSelectedStudentKeys] = useState<React.Key[]>([]);
    const [qrLoading, setQrLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const [templateLoading, setTemplateLoading] = useState(false);
    const [qrPayload, setQrPayload] = useState<{ qrCode: string; fullName?: string; userName?: string; }>();
    const [manualQrCode, setManualQrCode] = useState("");
    const [scannerError, setScannerError] = useState<string>();
    const [scanAction, setScanAction] = useState<AttendanceAction>("check-in");
    const [latestScan, setLatestScan] = useState<AttendanceScanResult>();
    const [attendanceDate, setAttendanceDate] = useState<Dayjs>(() => dayjs());

    const event = eventDetail as EventItem | undefined;

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
    }, [scannerOpen, event?.id]);

    useEffect(() => {
        if (!event) {
            return;
        }

        const start = dayjs(event.startDate).startOf("day");
        const end = dayjs(event.endDate).startOf("day");
        if (attendanceDate.isBefore(start, "day") || attendanceDate.isAfter(end, "day")) {
            setAttendanceDate(start);
        }
    }, [event?.id, event?.startDate, event?.endDate]);

    useEffect(() => {
        setLatestScan(undefined);
    }, [attendanceDate, scanAction]);

    const stopScanner = () => {
        if (html5QrCodeRef.current && scannerInitializedRef.current) {
            const scanner = html5QrCodeRef.current;
            try {
                const state = scanner.getState();
                if (state === 2) {
                    scanner.stop().then(() => {
                        try {
                            scanner.clear();
                        } catch {
                        }
                    }).catch(() => {
                    }).finally(() => {
                        html5QrCodeRef.current = null;
                        scannerInitializedRef.current = false;
                    });
                } else {
                    try {
                        scanner.clear();
                    } catch {
                    }
                    html5QrCodeRef.current = null;
                    scannerInitializedRef.current = false;
                }
            } catch {
                html5QrCodeRef.current = null;
                scannerInitializedRef.current = false;
            }
        } else {
            html5QrCodeRef.current = null;
            scannerInitializedRef.current = false;
        }
    };

    const reloadPageData = () => {
        userActionRef.current?.reload();
        void refreshEventDetail();
    };

    const handleAttendanceScan = async (qrCode: string) => {
        const normalizedQrCode = qrCode.trim();
        if (!event || scanRequestRef.current || !normalizedQrCode) {
            return;
        }

        const attendanceDateText = attendanceDate.format("YYYY-MM-DD");

        const now = Date.now();
        const scanKey = `${scanAction}:${attendanceDateText}:${normalizedQrCode}`;
        if (lastScanRef.current.value === scanKey && now - lastScanRef.current.at < 3000) {
            return;
        }

        lastScanRef.current = { value: scanKey, at: now };
        scanRequestRef.current = true;
        try {
            const response = await apiEventCheckIn({ eventId: event.id, qrCode: normalizedQrCode, action: scanAction, attendanceDate: attendanceDateText });
            const scanResult = response.data;
            setLatestScan(scanResult);
            setManualQrCode("");
            const actionLabel = scanResult.action === "check-out" ? "checkout" : "check-in";
            message.success(`Đã ${actionLabel} ${scanResult.fullName ?? scanResult.userName ?? "người tham gia"}`);
            reloadPageData();
        } finally {
            scanRequestRef.current = false;
        }
    };

    const startScanner = async () => {
        if (!event) {
            setScannerError("Không tìm thấy sự kiện để quét QR.");
            return;
        }

        try {
            const html5QrCode = new Html5Qrcode("qr-reader");
            html5QrCodeRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                (decodedText) => {
                    void handleAttendanceScan(decodedText);
                },
                () => {
                },
            );
            scannerInitializedRef.current = true;
        } catch {
            setScannerError("Không thể mở camera. Hãy kiểm tra quyền truy cập hoặc nhập mã QR thủ công.");
            html5QrCodeRef.current = null;
            scannerInitializedRef.current = false;
        }
    };

    const onAddUsers = async () => {
        if (!event || selectedStudents.length === 0) {
            return;
        }

        for (const student of selectedStudents) {
            await apiEventAddUser({
                eventId: event.id,
                userName: student.userName,
            });
        }

        message.success("Đã thêm người tham gia vào sự kiện");
        setAddUserModalOpen(false);
        setSelectedStudents([]);
        setSelectedStudentKeys([]);
        reloadPageData();
    };

    const onRemoveUser = async (user: EventUserItem) => {
        if (!event) {
            return;
        }

        await apiEventRemoveUser({
            eventId: event.id,
            userId: user.userId,
        });
        message.success("Đã xóa người tham gia khỏi sự kiện");
        reloadPageData();
    };

    const onOpenQr = async (user: EventUserItem) => {
        if (!event) {
            return;
        }

        setQrModalOpen(true);
        setQrLoading(true);
        try {
            const response = await apiEventGenerateQr({
                eventId: event.id,
                userId: user.userId,
            });
            setQrPayload(response);
        } finally {
            setQrLoading(false);
        }
    };

    const onExportExcel = async () => {
        if (!event) {
            return;
        }

        setExportLoading(true);
        try {
            const blob = await apiEventExport(event.id);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `check-in-${event.title}.xlsx`;
            link.click();
            window.URL.revokeObjectURL(url);
            message.success("Đã xuất file Excel theo tất cả ngày của sự kiện");
        } finally {
            setExportLoading(false);
        }
    };

    const onClickImport = () => {
        importInputRef.current?.click();
    };

    const onDownloadImportTemplate = async () => {
        if (!event) {
            return;
        }

        setTemplateLoading(true);
        try {
            const blob = await apiEventImportTemplate(event.id);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `check-in-template-${event.title}.xlsx`;
            link.click();
            window.URL.revokeObjectURL(url);
            message.success("Đã tải file mẫu import");
        } finally {
            setTemplateLoading(false);
        }
    };

    const onImportExcel: React.ChangeEventHandler<HTMLInputElement> = async (currentEvent) => {
        const file = currentEvent.target.files?.[0];
        currentEvent.target.value = "";

        if (!event || !file) {
            return;
        }

        if (!file.name.toLowerCase().endsWith(".xlsx")) {
            message.error("Chỉ hỗ trợ file Excel .xlsx");
            return;
        }

        setImportLoading(true);
        try {
            const response = await apiEventImport(event.id, file);
            message.success(response?.message ?? "Đã import dữ liệu check-in/check-out từ Excel");
            reloadPageData();
        } finally {
            setImportLoading(false);
        }
    };

    const disabledAttendanceDate = (current: Dayjs) => {
        if (!event) {
            return false;
        }

        const start = dayjs(event.startDate).startOf("day");
        const end = dayjs(event.endDate).startOf("day");
        return current.isBefore(start, "day") || current.isAfter(end, "day");
    };

    const attendanceDateText = attendanceDate.format("DD/MM/YYYY");
    const attendanceDateValue = attendanceDate.format("YYYY-MM-DD");

    return (
        <PageContainer
            title={event?.title ?? "Chi tiết sự kiện"}
            loading={eventLoading}
            extra={
                <Button icon={<LeftOutlined />} onClick={() => history.push("/event/overview")}>
                    Quay lại
                </Button>
            }
        >
            <div className="md:flex gap-4">
                <div className="md:w-2/5 mb-4">
                    <ProCard title="Phiên điểm danh">
                        {event ? (
                            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                                <Descriptions size="small" column={1} bordered>
                                    <Descriptions.Item label="Sự kiện">{event.title}</Descriptions.Item>
                                    <Descriptions.Item label="Mô tả">{event.description ?? "Không có mô tả."}</Descriptions.Item>
                                    <Descriptions.Item label="Thời gian">
                                        {dayjs(event.startDate).format("DD/MM/YYYY")} - {dayjs(event.endDate).format("DD/MM/YYYY")}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Số ngày">{event.numberOfDays}</Descriptions.Item>
                                    <Descriptions.Item label="Tiến độ">
                                        <Space wrap>
                                            <Tag color="blue">{event.checkedInCount}/{event.registrationCount} đã check-in</Tag>
                                            <Tag color="gold">{event.checkedOutCount} đã checkout</Tag>
                                        </Space>
                                    </Descriptions.Item>
                                </Descriptions>

                                <Alert
                                    type="info"
                                    showIcon
                                    message="Luồng check-in / checkout theo ngày"
                                    description={`Đang điểm danh cho ngày ${attendanceDateText}. Chọn thao tác trước khi quét. Mỗi người tham gia dùng cùng một mã QR cho check-in và checkout của sự kiện.`}
                                />

                                <Space align="center" wrap>
                                    <Typography.Text strong>Ngày điểm danh:</Typography.Text>
                                    <DatePicker
                                        allowClear={false}
                                        value={attendanceDate}
                                        format="DD/MM/YYYY"
                                        disabledDate={disabledAttendanceDate}
                                        onChange={(value) => {
                                            if (value) {
                                                setAttendanceDate(value.startOf("day"));
                                            }
                                        }}
                                    />
                                </Space>

                                <Radio.Group
                                    value={scanAction}
                                    onChange={(currentEvent) => setScanAction(currentEvent.target.value as AttendanceAction)}
                                    optionType="button"
                                    buttonStyle="solid"
                                    options={[
                                        { label: "Check-in", value: "check-in" },
                                        { label: "Checkout", value: "check-out" },
                                    ]}
                                />

                                {latestScan ? (
                                    <Alert
                                        type={latestScan.action === "check-out" ? "warning" : "success"}
                                        showIcon
                                        icon={<CheckCircleOutlined />}
                                        message={`Vừa ${latestScan.action === "check-out" ? "checkout" : "check-in"}: ${latestScan.fullName ?? latestScan.userName}`}
                                        description={`Ngày ${dayjs(latestScan.attendanceDate ?? attendanceDateValue).format("DD/MM/YYYY")} - Thời gian: ${dayjs(latestScan.action === "check-out" ? latestScan.checkedOutAt : latestScan.checkedInAt).format("HH:mm DD/MM/YYYY")}`}
                                    />
                                ) : null}

                                <Button type="primary" icon={<CameraOutlined />} onClick={() => setScannerOpen(true)}>
                                    Mở camera quét QR
                                </Button>
                            </Space>
                        ) : (
                            <Alert type="warning" showIcon message="Không tìm thấy sự kiện" description="Sự kiện có thể đã bị xóa hoặc đường dẫn không hợp lệ." />
                        )}
                    </ProCard>
                </div>

                <ProTable<EventUserItem>
                    actionRef={userActionRef}
                    rowKey="userId"
                    size="small"
                    search={{ layout: "vertical" }}
                    params={{ eventId: event?.id, attendanceDate: attendanceDateValue }}
                    request={async (params) => {
                        if (!event) {
                            return { data: [], success: true, total: 0 };
                        }

                        return apiEventUserList({ ...params, eventId: event.id, attendanceDate: attendanceDateValue });
                    }}
                    toolBarRender={() => [
                        <Button key="add-user" icon={<PlusOutlined />} disabled={!event || event.eventType === 1} onClick={() => setAddUserModalOpen(true)}>
                            Thêm người tham gia
                        </Button>,
                        <Button key="import" icon={<UploadOutlined />} loading={importLoading} disabled={!event} onClick={onClickImport}>
                            Nhập Excel
                        </Button>,
                        <Button key="import-template" icon={<FileExcelOutlined />} loading={templateLoading} disabled={!event} onClick={() => void onDownloadImportTemplate()}>
                            Tải mẫu import
                        </Button>,
                        <Button key="export" icon={<DownloadOutlined />} loading={exportLoading} disabled={!event} onClick={() => void onExportExcel()}>
                            Xuất Excel (tất cả ngày)
                        </Button>,
                    ]}
                    columns={[
                        {
                            title: "Mã SV",
                            dataIndex: "userName",
                        },
                        {
                            title: "Họ và tên",
                            dataIndex: "name",
                            search: false,
                            minWidth: 150,
                        },
                        {
                            title: "Lớp",
                            dataIndex: "classCode",
                            search: false,
                            render: (_, record) => (
                                <div>
                                    <div>{record.classCode}</div>
                                    <div className="text-gray-500 text-xs">{record.departmentName}</div>
                                </div>
                            ),
                        },
                        {
                            title: "Trạng thái",
                            dataIndex: "attendanceStatus",
                            valueEnum: {
                                "not-checked-in": { text: "Chưa check-in", status: "Default" },
                                "checked-in": { text: "Đã check-in", status: "Success" },
                                "checked-out": { text: "Đã checkout", status: "Warning" },
                            },
                            width: 120,
                        },
                        {
                            title: "Thời gian vào",
                            dataIndex: "checkedInAt",
                            valueType: "dateTime",
                            search: false,
                            width: 160,
                        },
                        {
                            title: "Người checkin",
                            dataIndex: "checkedInBy",
                            search: false,
                            hidden: true,
                        },
                        {
                            title: "Thời gian ra",
                            dataIndex: "checkedOutAt",
                            valueType: "dateTime",
                            search: false,
                            width: 160,
                        },
                        {
                            title: "Người checkout",
                            dataIndex: "checkedOutBy",
                            search: false,
                            hidden: true,
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
                <input
                    ref={importInputRef}
                    type="file"
                    accept=".xlsx"
                    style={{ display: "none" }}
                    onChange={(currentEvent) => void onImportExcel(currentEvent)}
                />
            </div>

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
                okButtonProps={{ disabled: selectedStudents.length === 0 || !event }}
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
                title={scanAction === "check-out" ? "Quét QR checkout" : "Quét QR check-in"}
                open={scannerOpen}
                onCancel={() => setScannerOpen(false)}
                footer={null}
                width={720}
            >
                <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                    <Alert type="info" showIcon message={`Ngày điểm danh: ${attendanceDateText}`} />

                    {scannerError ? (
                        <Alert type="warning" showIcon message={scannerError} />
                    ) : (
                        <div id="qr-reader" style={{ width: "100%", borderRadius: 12, overflow: "hidden" }} />
                    )}

                    <Alert
                        type="info"
                        showIcon
                        message="Nhập mã thủ công"
                        description={`Nếu camera không quét được, hãy dán chuỗi QR của người tham gia vào ô bên dưới để ${scanAction === "check-out" ? "checkout" : "check-in"}.`}
                    />

                    <Input.Search
                        placeholder="Dán chuỗi QR vào đây"
                        enterButton={scanAction === "check-out" ? "Checkout" : "Check-in"}
                        value={manualQrCode}
                        onChange={(currentEvent) => setManualQrCode(currentEvent.target.value)}
                        onSearch={(value) => void handleAttendanceScan(value)}
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