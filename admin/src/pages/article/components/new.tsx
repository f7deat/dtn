import { apiArticleCreate } from "@/services/article"
import { PlusOutlined } from "@ant-design/icons"
import { ModalForm, ProFormText, ProFormTextArea } from "@ant-design/pro-components"
import { Button, message } from "antd"

type Props = {
    reload?: () => void;
}

const NewArticle: React.FC<Props> = ({ reload }) => {

    const handleSubmit = async (values: any) => {
        await apiArticleCreate(values);
        message.success('Bài viết đã được tạo thành công');
        reload?.();
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