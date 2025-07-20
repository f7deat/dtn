"use client";

import { faUser } from "@fortawesome/free-regular-svg-icons";
import { faLock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Form, Input } from "antd"

const LoginForm: React.FC = () => {
    return (
        <Form layout="vertical" className="max-w-md mx-auto">
            <Form.Item label="Mã sinh viên" name="userName" rules={[{ required: true, message: 'Vui lòng nhập mã sinh viên!' }]}>
                <Input size="large" placeholder="Mã sinh viên" prefix={<FontAwesomeIcon icon={faUser} className="w-4 h-4 mr-1 text-slate-500" />} variant="filled" />
            </Form.Item>
            <Form.Item label="Mật khẩu" name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}>
                <Input.Password size="large" placeholder="Mật khẩu" prefix={<FontAwesomeIcon icon={faLock} className="text-slate-500 w-4 h-4 mr-1" />} variant="filled" />
            </Form.Item>
            <Form.Item>
                <button type="submit" className="bg-red-600 w-full cursor-pointer text-white px-6 py-3 rounded hover:bg-red-700 transition-colors font-bold uppercase">
                    Đăng nhập
                </button>
            </Form.Item>
        </Form>
    )
}

export default LoginForm;