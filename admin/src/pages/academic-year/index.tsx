import {
    apiAcademicYearCreate,
    apiAcademicYearDelete,
    apiAcademicYearList,
    apiAcademicYearUpdate,
} from "@/services/academic-year";
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
import { Button, Dropdown, message, Popconfirm } from "antd";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";

const Index: React.FC = () => {
    const actionRef = useRef<ActionType>(null);
    const formRef = useRef<ProFormInstance>(null);
    const [academicYear, setAcademicYear] = useState<any>();
    const [open, setOpen] = useState<boolean>(false);

    useEffect(() => {
        if (academicYear && formRef.current) {
            formRef.current.setFieldsValue({
                name: academicYear.name,
                startDate: dayjs(academicYear.startDate),
                endDate: dayjs(academicYear.endDate),
            });
        }
        if (!academicYear) {
            formRef.current?.resetFields();
        }
    }, [academicYear, open]);

    const onFinish = async (values: any) => {
        const payload = {
            ...values,
            startDate: dayjs(values.startDate)?.format("YYYY-MM-DD"),
            endDate: dayjs(values.endDate)?.format("YYYY-MM-DD"),
        };

        if (academicYear) {
            await apiAcademicYearUpdate({ ...payload, id: academicYear.id });
        } else {
            await apiAcademicYearCreate(payload);
        }

        message.success(academicYear ? "Cập nhật năm học thành công" : "Thêm năm học thành công");
        actionRef.current?.reload();
        formRef.current?.resetFields();
        setAcademicYear(undefined);
        setOpen(false);
        return true;
    };

    const onDelete = async (id: number) => {
        await apiAcademicYearDelete(id);
        actionRef.current?.reload();
        message.success("Xóa năm học thành công");
    };

    return (
        <PageContainer
            extra={
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        setAcademicYear(undefined);
                        setOpen(true);
                    }}
                >
                    Thêm năm học
                </Button>
            }
        >
            <ProTable
                request={apiAcademicYearList}
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
                        title: "Tên năm học",
                        dataIndex: "name",
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
                        title: "Kỳ học",
                        dataIndex: "semesterCount",
                        valueType: "digit",
                        search: false,
                        width: 90,
                    },
                    {
                        title: "Sự kiện",
                        dataIndex: "eventCount",
                        valueType: "digit",
                        search: false,
                        width: 90,
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
                                                setAcademicYear(record);
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
                                title="Bạn có chắc chắn muốn xóa năm học này?"
                                onConfirm={() => onDelete(record.id)}
                            >
                                <Button type="primary" danger size="small" icon={<DeleteOutlined />} />
                            </Popconfirm>,
                        ],
                    },
                ]}
            />
            <ModalForm
                title={academicYear ? "Cập nhật năm học" : "Thêm năm học"}
                formRef={formRef}
                open={open}
                onOpenChange={(visible) => {
                    setOpen(visible);
                    if (!visible) {
                        setAcademicYear(undefined);
                        formRef.current?.resetFields();
                    }
                }}
                onFinish={onFinish}
            >
                <ProFormText
                    name="name"
                    label="Tên năm học"
                    rules={[
                        {
                            required: true,
                            message: "Vui lòng nhập tên năm học",
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
    )
}

export default Index;