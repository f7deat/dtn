declare namespace API {
  type FakeCaptcha = {
    code?: string;
    status?: string;
  };

  type CurrentUser = {
    id: number;
    name: string;
    avatar: string;
    email: string;
    phone: string;
    access?: string;
    // 其他用户信息
  };
}
