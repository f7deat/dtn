import { request } from "@umijs/max";

export async function queryCurrentUser() {
    return request('https://identity.dhhp.edu.vn/user');
}

/** đăng nhập POST /api/login/account */
export async function login(body: any) {
    return request('https://identity.dhhp.edu.vn/login/password-sign-in', {
        method: 'POST',
        data: body
    });
}