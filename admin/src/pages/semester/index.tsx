import { apiAcademicYearOptions } from "@/services/academic-year";
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
    ProFormSelect,
    ProFormText,
    ProTable,
} from "@ant-design/pro-components";
import { Button, Dropdown, message, Popconfirm } from "antd";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";

const Index: React.FC = () => {
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
                academicYearId: semester.academicYearId,
            });
        }
        if (!semester) {
            formRef.current?.resetFields();
        }
    }, [semester, open]);

    const onFinish = async (values: any) => {
        const payload = {
            ...values,
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
                request={apiSemesterList}
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
                        valueType: "select",
                        request: apiAcademicYearOptions,
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
                <ProFormSelect
                    name="academicYearId"
                    label="Năm học"
                    request={apiAcademicYearOptions}
                    rules={[
                        {
                            required: true,
                            message: "Vui lòng chọn năm học",
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
