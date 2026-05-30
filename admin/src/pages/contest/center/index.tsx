import {
    apiContestDeleteSubmission,
    apiContestExportSubmissions,
    apiContestGet,
    apiContestSubmissionList,
    apiContestUpdateSubmissionStatus,
} from "@/services/contest";
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    DeleteOutlined,
    DownloadOutlined,
} from "@ant-design/icons";
import {
    ActionType,
    ModalForm,
    PageContainer,
    ProFormTextArea,
    ProTable,
} from "@ant-design/pro-components";
import { history, useParams, useRequest } from "@umijs/max";
import { Button, Popconfirm, message, Tag } from "antd";
import { useRef, useState } from "react";

interface SubmissionItem {
    id: string;
    userName: string;
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    originalFileName: string;
    fileUrl: string;
    note?: string;
    status: 0 | 1 | 2;
    adminNote?: string;
    submittedAt: string;
}

const Index: React.FC = () => {
    const { id = "" } = useParams<{ id: string }>();
    const actionRef = useRef<ActionType>(null);

    const [exporting, setExporting] = useState(false);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [deletingSubmissionId, setDeletingSubmissionId] = useState<string>();
    const [selectedSubmission, setSelectedSubmission] = useState<SubmissionItem>();

    const { data, loading } = useRequest(() => apiContestGet(id), {
        ready: !!id,
        refreshDeps: [id],
    });

    const onExport = async () => {
        setExporting(true);
        try {
            const blob = await apiContestExportSubmissions(id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `contest-submissions-${data?.title ?? id}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);
            message.success("Đã xuất danh sách bài dự thi");
        } finally {
            setExporting(false);
        }
    };

    const onApprove = async (record: SubmissionItem) => {
        await apiContestUpdateSubmissionStatus({
            submissionId: record.id,
            status: 1,
            adminNote: "",
        });
        message.success("Đã duyệt bài dự thi");
        actionRef.current?.reload();
    };

    const openRejectModal = (record: SubmissionItem) => {
        setSelectedSubmission(record);
        setRejectModalOpen(true);
    };

    const onReject = async (values: { adminNote: string }) => {
        if (!selectedSubmission) {
            return false;
        }

        setRejecting(true);
        try {
            await apiContestUpdateSubmissionStatus({
                submissionId: selectedSubmission.id,
                status: 2,
                adminNote: values.adminNote,
            });
            message.success("Đã từ chối bài dự thi");
            setRejectModalOpen(false);
            setSelectedSubmission(undefined);
            actionRef.current?.reload();
            return true;
        } finally {
            setRejecting(false);
        }
    };

    const onDeleteSubmission = async (record: SubmissionItem) => {
        setDeletingSubmissionId(record.id);
        try {
            await apiContestDeleteSubmission(record.id);
            message.success("Đã xóa bài dự thi");
            actionRef.current?.reload();
        } finally {
            setDeletingSubmissionId(undefined);
        }
    };

    return (
        <PageContainer
            title={data?.title ?? "Chi tiết cuộc thi"}
            loading={loading}
            onBack={() => history.back()}
            extra={[
                <Button key="export" icon={<DownloadOutlined />} onClick={onExport} loading={exporting}>
                    Xuất Excel
                </Button>,
            ]}
        >
            <ProTable<SubmissionItem>
                actionRef={actionRef}
                rowKey="id"
                search={{ layout: "vertical" }}
                request={(params) => apiContestSubmissionList(id, params)}
                columns={[
                    {
                        title: "#",
                        valueType: "indexBorder",
                        width: 48,
                    },
                    {
                        title: "Mã sinh viên",
                        dataIndex: "userName",
                    },
                    {
                        title: "Sinh viên",
                        dataIndex: "userName",
                        render: (_, record) => (
                            <div>
                                <div className="font-medium">{record.fullName ?? record.userName}</div>
                            </div>
                        ),
                    },
                    {
                        title: "Email",
                        dataIndex: "email",
                        copyable: true,
                    },
                    {
                        title: "SĐT",
                        dataIndex: "phoneNumber",
                        search: false,
                        width: 120,
                    },
                    {
                        title: "Bài nộp",
                        dataIndex: "originalFileName",
                        search: false,
                        render: (_, record) => (
                            <a href={record.fileUrl} target="_blank" rel="noreferrer">
                                {record.originalFileName}
                            </a>
                        ),
                    },
                    {
                        title: "Ghi chú SV",
                        dataIndex: "note",
                        search: false,
                        ellipsis: true,
                    },
                    {
                        title: "Trạng thái",
                        dataIndex: "status",
                        width: 140,
                        valueEnum: {
                            0: { text: "Chờ duyệt", status: "Processing" },
                            1: { text: "Đã duyệt", status: "Success" },
                            2: { text: "Từ chối", status: "Error" },
                        },
                    },
                    {
                        title: "Ghi chú quản trị",
                        dataIndex: "adminNote",
                        search: false,
                        ellipsis: true,
                        render: (_, record) => record.adminNote ? <span>{record.adminNote}</span> : <Tag>Không có</Tag>,
                    },
                    {
                        title: "Thời gian nộp",
                        dataIndex: "submittedAt",
                        valueType: "dateTime",
                        search: false,
                        width: 170,
                    },
                    {
                        title: "Thao tác",
                        valueType: "option",
                        width: 250,
                        render: (_, record) => [
                            <Button
                                key="approve"
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                size="small"
                                onClick={() => void onApprove(record)}
                            >
                                Duyệt
                            </Button>,
                            <Button
                                key="reject"
                                danger
                                icon={<CloseCircleOutlined />}
                                size="small"
                                onClick={() => openRejectModal(record)}
                            >
                                Từ chối
                            </Button>,
                            <Popconfirm
                                key="delete"
                                title="Xóa bài dự thi"
                                description="Bạn có chắc muốn xóa bài dự thi này không?"
                                okText="Xóa"
                                cancelText="Hủy"
                                okButtonProps={{ danger: true, loading: deletingSubmissionId === record.id }}
                                onConfirm={() => void onDeleteSubmission(record)}
                            >
                                <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    size="small"
                                    loading={deletingSubmissionId === record.id}
                                >
                                    Xóa
                                </Button>
                            </Popconfirm>,
                        ],
                    },
                ]}
                size="small"
            />

            <ModalForm<{ adminNote: string }>
                title="Từ chối bài dự thi"
                open={rejectModalOpen}
                modalProps={{
                    destroyOnHidden: true,
                    onCancel: () => {
                        if (!rejecting) {
                            setRejectModalOpen(false);
                            setSelectedSubmission(undefined);
                        }
                    },
                }}
                submitter={{
                    searchConfig: { submitText: "Xác nhận từ chối" },
                    submitButtonProps: { danger: true, loading: rejecting },
                }}
                onFinish={onReject}
            >
                <ProFormTextArea
                    name="adminNote"
                    label="Ghi chú từ chối"
                    rules={[{ required: true, message: "Vui lòng nhập lý do từ chối" }]}
                    fieldProps={{
                        rows: 4,
                        placeholder: "Ví dụ: File sai định dạng, thiếu nội dung theo thể lệ...",
                    }}
                />
            </ModalForm>
        </PageContainer>
    );
};

export default Index;
