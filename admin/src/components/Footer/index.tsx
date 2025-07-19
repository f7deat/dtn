import { HomeOutlined } from '@ant-design/icons';
import { DefaultFooter } from '@ant-design/pro-components';
import React from 'react';

const Footer: React.FC = () => {
  return (
    <DefaultFooter
      style={{
        background: 'none',
      }}
      copyright="2025 Trường Đại học Hải Phòng"
      links={[
        {
          key: 'home',
          title: <HomeOutlined />,
          href: 'https://dtn.dhhp.edu.vn',
          blankTarget: true,
        },
        {
          key: 'link',
          title: 'Trang chủ',
          href: 'https://dtn.dhhp.edu.vn',
          blankTarget: true,
        },
      ]}
    />
  );
};

export default Footer;
