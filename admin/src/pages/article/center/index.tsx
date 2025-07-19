import MyCkEditor from "@/components/ckeditor/MyCkEditor";
import { apiArticleGet, apiArticleUpdate } from "@/services/article";
import { apiUploadFile } from "@/services/file";
import { LeftOutlined, UploadOutlined } from "@ant-design/icons";
import { PageContainer, ProCard, ProForm, ProFormInstance, ProFormSelect, ProFormText, ProFormTextArea } from "@ant-design/pro-components"
import { history, useParams, useRequest } from "@umijs/max";
import { Button, Col, message, Row } from "antd";
import { useEffect, useRef, useState } from "react";

const Index: React.FC = () => {

    const { id } = useParams<{ id: string }>();
    const { data } = useRequest(() => apiArticleGet(id));
    const formRef = useRef<ProFormInstance>(null);
    const [thumbnail, setThumbnail] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (data && formRef.current) {
            formRef.current.setFieldsValue({
                title: data.title,
                description: data.description,
                thumbnail: data.thumbnail,
                isActive: data.isActive,
                content: data.content
            });
            setThumbnail(data.thumbnail);
        }
    }, [data]);

    const onFinish = async (values: any) => {
        values.id = id;
        await apiArticleUpdate(values);
        message.success('Cập nhật thành công');
    }

    const onThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiUploadFile(formData);
        formRef.current?.setFieldValue('thumbnail', response.url);
        setThumbnail(response.url);
        message.success('Tải ảnh lên thành công');
    }

    return (
        <PageContainer title={data?.title} extra={<Button icon={<LeftOutlined />} onClick={() => history.back()}>Quay lại</Button>}>
            <ProCard>
                <ProForm onFinish={onFinish} formRef={formRef}>
                    <Row gutter={[16, 16]}>
                        <Col md={18}>
                            <ProFormText name="title" label="Tiêu đề" rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập tiêu đề'
                                }
                            ]} />
                            <ProFormTextArea name="description" label="Mô tả"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Vui lòng nhập mô tả'
                                    }
                                ]}
                            />
                            <MyCkEditor name="content" label="Nội dung" rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập nội dung'
                                }
                            ]} />
                        </Col>
                        <Col md={6}>
                            <div className="w-full h-52 bg-gray-200 mb-4 relative rounded">
                                <label className="absolute top-0 right-0">
                                    <Button type="primary" icon={<UploadOutlined />}>Chọn ảnh</Button>
                                    <input type="file" accept="image/*" onChange={onThumbnailChange} className="opacity-0 absolute z-10 top-0 right-0 " />
                                </label>
                                {thumbnail && <img src={thumbnail} alt="Thumbnail" className="w-full h-full object-cover rounded" />}
                            </div>
                            <ProFormText name="thumbnail" label="Ảnh đại diện" rules={[
                                {
                                    required: true,
                                    message: 'Vui lòng nhập ảnh đại diện'
                                }
                            ]} />
                            <ProFormSelect name="isActive" label="Trạng thái" options={[
                                { label: 'Xuất bản', value: true },
                                { label: 'Bản nháp', value: false }
                            ]} rules={[
                                { required: true, message: 'Vui lòng chọn trạng thái' }
                            ]} allowClear={false} />
                        </Col>
                    </Row>
                </ProForm>
            </ProCard>
        </PageContainer>
    )
}

export default Index;