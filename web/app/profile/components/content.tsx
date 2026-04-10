"use client";

import { apiMyEventQr } from "@/app/services/event";
import { CalendarOutlined, CheckCircleOutlined, QrcodeOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Col, Descriptions, Empty, Modal, QRCode, Row, Space, Tag, Typography, message } from "antd";
import dayjs from "dayjs";
import { useState } from "react";

interface ProfileContentProps {
  currentUser: API.CurrentUser;
  events: API.MyEventItem[];
}

const ProfileContent: React.FC<ProfileContentProps> = ({ currentUser, events }) => {
  const [qrOpen, setQrOpen] = useState(false);
  const [loadingQr, setLoadingQr] = useState(false);
  const [selectedQr, setSelectedQr] = useState<API.EventQrPayload | null>(null);

  const displayName = currentUser.fullName ?? [currentUser.firstName, currentUser.lastName].filter(Boolean).join(" ") ?? currentUser.userName ?? "Sinh viên";

  const onOpenQr = async (eventId: string) => {
    setLoadingQr(true);
    setQrOpen(true);
    try {
      const response = await apiMyEventQr(eventId);
      
      if (!response?.qrCode) {
        message.error("Không lấy được mã QR.");
        setQrOpen(false);
        return;
      }

      setSelectedQr(response);
    } finally {
      setLoadingQr(false);
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <div>
                <Typography.Text type="secondary">Hồ sơ cá nhân</Typography.Text>
                <Typography.Title level={3} style={{ marginTop: 8, marginBottom: 0 }}>{displayName}</Typography.Title>
              </div>
              <Descriptions size="small" column={1} bordered>
                <Descriptions.Item label="Mã sinh viên">{currentUser.userName ?? "-"}</Descriptions.Item>
                <Descriptions.Item label="Email">{currentUser.email ?? "-"}</Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">{currentUser.phoneNumber ?? "-"}</Descriptions.Item>
                <Descriptions.Item label="Lớp">{currentUser.className ?? currentUser.classCode ?? "-"}</Descriptions.Item>
              </Descriptions>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card>
            <Alert
              type="info"
              showIcon
              message="Mã QR check-in sự kiện"
              description="Mỗi sự kiện bạn tham gia sẽ có một mã QR riêng. Khi đến sự kiện, mở hồ sơ cá nhân và đưa mã này cho người quản lý quét để check-in."
            />
          </Card>
        </Col>
      </Row>

      <Card title="Sự kiện của tôi">
        {events.length === 0 ? (
          <Empty description="Bạn chưa được thêm vào sự kiện nào." />
        ) : (
          <Row gutter={[20, 20]}>
            {events.map((eventItem) => (
              <Col xs={24} md={12} xl={8} key={eventItem.id}>
                <Card hoverable>
                  <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                    <div>
                      <Typography.Title level={5} style={{ marginBottom: 8 }}>{eventItem.title}</Typography.Title>
                      <Typography.Paragraph type="secondary" style={{ minHeight: 44, marginBottom: 0 }} ellipsis={{ rows: 2 }}>
                        {eventItem.description ?? "Không có mô tả."}
                      </Typography.Paragraph>
                    </div>

                    <Space wrap>
                      <Tag icon={<CalendarOutlined />} color="blue">
                        {dayjs(eventItem.startDate).format("DD/MM/YYYY")}
                      </Tag>
                      {eventItem.eventType === 1 && (
                        <Tag color="processing">Công khai</Tag>
                      )}
                      <Tag icon={<CheckCircleOutlined />} color={eventItem.isCheckedIn ? "success" : "default"}>
                        {eventItem.isCheckedIn ? "Đã check-in" : "Chưa check-in"}
                      </Tag>
                    </Space>

                    {eventItem.checkedInAt ? (
                      <Typography.Text type="secondary">
                        Đã xác nhận lúc {dayjs(eventItem.checkedInAt).format("HH:mm DD/MM/YYYY")}
                      </Typography.Text>
                    ) : (
                      <Typography.Text type="secondary">
                        Hãy mở mã QR khi tham gia sự kiện.
                      </Typography.Text>
                    )}

                    <Button type="primary" icon={<QrcodeOutlined />} onClick={() => void onOpenQr(eventItem.id)}>
                      Lấy mã QR
                    </Button>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      <Modal
        title="Mã QR check-in"
        open={qrOpen}
        footer={null}
        onCancel={() => {
          setQrOpen(false);
          setSelectedQr(null);
        }}
      >
        <Space direction="vertical" align="center" size="middle" style={{ width: "100%" }}>
          <Typography.Title level={4} style={{ marginBottom: 0 }}>{selectedQr?.fullName ?? displayName}</Typography.Title>
          <Typography.Text type="secondary"><UserOutlined /> {selectedQr?.userName ?? currentUser.userName ?? ""}</Typography.Text>
          {loadingQr ? <Typography.Text>Đang tạo mã QR...</Typography.Text> : null}
          {selectedQr?.qrCode ? <QRCode value={selectedQr.qrCode} size={240} /> : null}
          {selectedQr?.qrCode ? <Typography.Paragraph copyable code>{selectedQr.qrCode}</Typography.Paragraph> : null}
        </Space>
      </Modal>
    </Space>
  );
};

export default ProfileContent;