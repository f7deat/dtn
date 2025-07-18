import { apiArticleGet, apiArticleUpdate } from "@/services/article";
import { PageContainer, ProCard, ProForm, ProFormInstance, ProFormText, ProFormTextArea } from "@ant-design/pro-components"
import { useParams, useRequest } from "@umijs/max";
import { Col, message, Row } from "antd";
import { useEffect, useRef } from "react";

const Index: React.FC = () => {

    const { id } = useParams<{ id: string }>();
    const { data } = useRequest(() => apiArticleGet(id));
    const formRef = useRef<ProFormInstance>(null);

    useEffect(() => {
        if (data && formRef.current) {
            formRef.current.setFieldsValue({
                title: data.title,
                description: data.description,
                thumbnail: data.thumbnail
            });
        }
    }, [data]);

    const onFinish = async (values: any) => {
        values.id = id;
        await apiArticleUpdate(values);
        message.success('Cập nhật thành công');
    }

    return (
        <PageContainer title={data?.title}>
            <ProCard>
                <ProForm onFinish={onFinish} formRef={formRef}>
                    <Row gutter={[16, 16]}>
                        <Col md={18}>
                            <ProFormText name="title" label="Tiêu đề" initialValue={data?.title} />
                            <ProFormTextArea name="description" label="Mô tả" initialValue={data?.description} />
                        </Col>
                        <Col md={6}>
                            <ProFormText name="thumbnail" label="Ảnh đại diện" initialValue={data?.thumbnail} />
                        </Col>
                    </Row>
                </ProForm>
            </ProCard>
        </PageContainer>
    )
}

export default Index;