import { apiArticleCreate } from "@/services/article"
import { PlusOutlined } from "@ant-design/icons"
import { ModalForm, ProFormText, ProFormTextArea } from "@ant-design/pro-components"
import { Button } from "antd"

const NewArticle: React.FC = () => {

    const handleSubmit = async (values: any) => {
        await apiArticleCreate(values);
        return true; // Return true to close the modal on success
    }

    return (
        <>
            <ModalForm
                title="Tạo bài viết mới"
                trigger={<Button type="primary" icon={<PlusOutlined />}>Tạo bài viết</Button>}
                onFinish={handleSubmit}
            >
                <ProFormText
                    name="title"
                    label="Tiêu đề"
                    rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
                />
                <ProFormTextArea
                    name="description"
                    label="Mô tả"
                    rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
                />
            </ModalForm>
        </>
    )
}

export default NewArticle;