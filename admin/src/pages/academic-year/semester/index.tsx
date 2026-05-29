import {
    apiSemesterCreate,
    apiSemesterDelete,
    apiSemesterList,
    apiSemesterUpdate,
} from "@/services/semester";
import { DeleteOutlined, MoreOutlined, PlusOutlined } from "@ant-design/icons";
import {
    ActionType,
    ModalForm,
    PageContainer,
    ProFormDatePicker,
    ProFormInstance,
    ProFormText,
    ProTable,
} from "@ant-design/pro-components";
import { useParams } from "@umijs/max";
import { Button, Dropdown, message, Popconfirm } from "antd";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { history } from "@umijs/max";

const Index: React.FC = () => {
    const params = useParams<{ id?: string }>();
    const academicYearId = Number(params.id);
    const isValidAcademicYearId = Number.isInteger(academicYearId) && academicYearId > 0;
    const actionRef = useRef<ActionType>(null);
    const formRef = useRef<ProFormInstance>(null);
    const [semester, setSemester] = useState<any>();
    const [open, setOpen] = useState<boolean>(false);

    useEffect(() => {
        if (semester && formRef.current) {
            formRef.current.setFieldsValue({
                name: semester.name,
                startDate: dayjs(semester.startDate),
                endDate: dayjs(semester.endDate),
            });
        }
        if (!semester) {
            formRef.current?.resetFields();
        }
    }, [semester, open]);

    const onFinish = async (values: any) => {
        if (!isValidAcademicYearId) {
            message.error("Không tìm thấy năm học hợp lệ");
            return false;
        }

        const payload = {
            ...values,
            academicYearId,
            startDate: dayjs(values.startDate)?.format("YYYY-MM-DD"),
            endDate: dayjs(values.endDate)?.format("YYYY-MM-DD"),
        };

        if (semester) {
            await apiSemesterUpdate({ ...payload, id: semester.id });
        } else {
            await apiSemesterCreate(payload);
        }

        message.success(semester ? "Cập nhật kỳ học thành công" : "Thêm kỳ học thành công");
        actionRef.current?.reload();
        formRef.current?.resetFields();
        setSemester(undefined);
        setOpen(false);
        return true;
    };

    const onDelete = async (id: number) => {
        await apiSemesterDelete(id);
        actionRef.current?.reload();
        message.success("Xóa kỳ học thành công");
    };

    return (
        <PageContainer
            onBack={() => history.back()}
            extra={
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        setSemester(undefined);
                        setOpen(true);
                    }}
                >
                    Thêm kỳ học
                </Button>
            }
        >
            <ProTable
                request={(tableParams: any) => {
                    if (!isValidAcademicYearId) {
                        return Promise.resolve({ data: [], success: true, total: 0 });
                    }
                    return apiSemesterList({ ...tableParams, academicYearId });
                }}
                actionRef={actionRef}
                rowKey="id"
                search={{
                    layout: "vertical",
                }}
                columns={[
                    {
                        title: "#",
                        valueType: "indexBorder",
                        width: 48,
                    },
                    {
                        title: "Tên kỳ học",
                        dataIndex: "name",
                    },
                    {
                        title: "Năm học",
                        dataIndex: "academicYearId",
                        search: false,
                        render: (_, record) => record.academicYearName,
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
                        title: "Tác vụ",
                        valueType: "option",
                        width: 90,
                        render: (_, record) => [
                            <Dropdown
                                key="more"
                                menu={{
                                    items: [
                                        {
                                            key: "edit",
                                            label: "Sửa",
                                            onClick: () => {
                                                setSemester(record);
                                                setOpen(true);
                                            },
                                        },
                                    ],
                                }}
                            >
                                <Button type="dashed" size="small" icon={<MoreOutlined />} />
                            </Dropdown>,
                            <Popconfirm
                                key="delete"
                                title="Bạn có chắc chắn muốn xóa kỳ học này?"
                                onConfirm={() => onDelete(record.id)}
                            >
                                <Button type="primary" danger size="small" icon={<DeleteOutlined />} />
                            </Popconfirm>,
                        ],
                    },
                ]}
            />
            <ModalForm
                title={semester ? "Cập nhật kỳ học" : "Thêm kỳ học"}
                formRef={formRef}
                open={open}
                onOpenChange={(visible) => {
                    setOpen(visible);
                    if (!visible) {
                        setSemester(undefined);
                        formRef.current?.resetFields();
                    }
                }}
                onFinish={onFinish}
            >
                <ProFormText
                    name="name"
                    label="Tên kỳ học"
                    rules={[
                        {
                            required: true,
                            message: "Vui lòng nhập tên kỳ học",
                        },
                    ]}
                />
                <ProFormDatePicker
                    name="startDate"
                    label="Ngày bắt đầu"
                    rules={[
                        {
                            required: true,
                            message: "Vui lòng chọn ngày bắt đầu",
                        },
                    ]}
                />
                <ProFormDatePicker
                    name="endDate"
                    label="Ngày kết thúc"
                    rules={[
                        {
                            required: true,
                            message: "Vui lòng chọn ngày kết thúc",
                        },
                        ({ getFieldValue }: { getFieldValue: (name: string) => any; }) => ({
                            validator(_: any, value: any) {
                                const startDate = getFieldValue("startDate");
                                if (!startDate || !value || !dayjs(value).isBefore(dayjs(startDate), "day")) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu"));
                            },
                        }),
                    ]}
                />
            </ModalForm>
        </PageContainer>
    );
};

export default Index;