"use client";

import { apiLogin } from "@/app/services/auth";
import { faUser } from "@fortawesome/free-regular-svg-icons";
import { faLock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Form, Input, notification } from "antd"
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const LoginForm: React.FC = () => {

    const [api, contextHolder] = notification.useNotification();
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    const onFinish = async (values: { username: string; password: string; }) => {
        setSubmitting(true);
        try {
            const response = await apiLogin(values.username, values.password);
            if (!response.data?.succeeded) {
                api.error({
                    message: response.data?.message ?? "Đăng nhập thất bại."
                });
                return;
            }
            localStorage.setItem("thp_token", response.data.data);
            api.success({
                message: "Đăng nhập thành công"
            });
            const redirectUrl = searchParams.get("redirect") || "/profile";
            router.push(redirectUrl);
            router.refresh();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            {contextHolder}
            <div className="mx-4 md:mx-0">
                <Form layout="vertical" className="max-w-md mx-auto" onFinish={onFinish}>
                    <Form.Item label="Mã sinh viên" name="username" rules={[{ required: true, message: 'Vui lòng nhập mã sinh viên!' }]}>
                        <Input size="large" placeholder="Mã sinh viên" prefix={<FontAwesomeIcon icon={faUser} className="w-4 h-4 mr-1 text-slate-500" />} variant="filled" />
                    </Form.Item>
                    <Form.Item label="Mật khẩu" name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}>
                        <Input.Password size="large" placeholder="Mật khẩu" prefix={<FontAwesomeIcon icon={faLock} className="text-slate-500 w-4 h-4 mr-1" />} variant="filled" />
                    </Form.Item>
                    <Form.Item>
                        <button type="submit" disabled={submitting} className="bg-red-600 w-full cursor-pointer text-white px-6 py-3 rounded hover:bg-red-700 transition-colors font-bold uppercase disabled:opacity-60 disabled:cursor-not-allowed">
                            {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
                        </button>
                    </Form.Item>
                </Form>
            </div>
        </>
    )
}

export default LoginForm;