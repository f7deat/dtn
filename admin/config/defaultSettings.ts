import type { ProLayoutProps } from '@ant-design/pro-components';

const Settings: ProLayoutProps & {
  pwa?: boolean;
  logo?: string;
} = {
  navTheme: 'light',
  colorPrimary: '#e7000b',
  layout: 'mix',
  contentWidth: 'Fluid',
  fixedHeader: false,
  fixSiderbar: true,
  colorWeak: false,
  title: 'Đoàn Thanh Niên',
  pwa: true,
  logo: 'https://upload.wikimedia.org/wikipedia/vi/0/09/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png',
  iconfontUrl: '',
  token: {
    sider: {
      colorMenuBackground: '#020618',
      colorTextMenu: '#fff',
      colorTextMenuSelected: '#FFFFFF',
      colorTextMenuItemHover: '#e7000b',
      colorTextMenuActive: '#fff',
      colorBgMenuItemSelected: '#e7000b'
    }
  },
};

export default Settings;
