"use client";

import { apiMyEventAttendanceHistory, apiMyEventQr } from "@/app/services/event";
import { apiAcademicYearOptions } from "@/app/services/academicYear";
import { CalendarOutlined, CheckCircleOutlined, HistoryOutlined, PrinterOutlined, QrcodeOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Col, Descriptions, Empty, List, Modal, QRCode, Row, Select, Space, Tag, Typography, message } from "antd";
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
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryEvent, setSelectedHistoryEvent] = useState<API.MyEventItem | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<API.MyEventAttendanceHistoryItem[]>([]);
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);
  const [academicYearOptions, setAcademicYearOptions] = useState<API.AcademicYearOption[]>([]);
  const [academicYearLoading, setAcademicYearLoading] = useState(false);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<number | null>(null);

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

  const onOpenCertificateModal = async () => {
    setCertificateModalOpen(true);
    if (academicYearOptions.length > 0) {
      return;
    }

    setAcademicYearLoading(true);
    try {
      const response = await apiAcademicYearOptions();
      setAcademicYearOptions(response);
      if (response.length > 0) {
        setSelectedAcademicYearId(response[0].value);
      }
    } finally {
      setAcademicYearLoading(false);
    }
  };

  const onOpenHistory = async (eventItem: API.MyEventItem) => {
    setSelectedHistoryEvent(eventItem);
    setHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const items = await apiMyEventAttendanceHistory(eventItem.id);
      setAttendanceHistory(items);
    } finally {
      setHistoryLoading(false);
    }
  };

  const onPrintCertificate = () => {
    if (!selectedAcademicYearId) {
      message.warning("Vui lòng chọn năm học.");
      return;
    }

    const selectedAcademicYear = academicYearOptions.find((item) => item.value === selectedAcademicYearId);
    const params = new URLSearchParams();
    params.set("academicYearId", String(selectedAcademicYearId));
    if (selectedAcademicYear?.label) {
      params.set("academicYearLabel", selectedAcademicYear.label);
    }

    window.open(`/profile/certificate?${params.toString()}`, "_blank", "noopener,noreferrer");
    setCertificateModalOpen(false);
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
              <Descriptions size="small" column={1} bordered className="mb-2">
                <Descriptions.Item label="Mã sinh viên">{currentUser.userName ?? "-"}</Descriptions.Item>
                <Descriptions.Item label="Email">{currentUser.email ?? "-"}</Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">{currentUser.phoneNumber ?? "-"}</Descriptions.Item>
                <Descriptions.Item label="Lớp">{currentUser.className ?? currentUser.classCode ?? "-"}</Descriptions.Item>
              </Descriptions>
              <Button type="primary" icon={<PrinterOutlined />} block onClick={() => void onOpenCertificateModal()}>
                In giấy xác nhận
              </Button>
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
                      {eventItem.checkedOutAt ? (
                        <Tag color="warning">Đã checkout</Tag>
                      ) : null}
                    </Space>

                    <Space direction="vertical" size={4} style={{ width: "100%" }}>
                      {eventItem.checkedInAt ? (
                        <Typography.Text type="secondary">
                          Check-in lúc {dayjs(eventItem.checkedInAt).format("HH:mm DD/MM/YYYY")}
                        </Typography.Text>
                      ) : (
                        <Typography.Text type="secondary">
                          Hãy mở mã QR khi tham gia sự kiện.
                        </Typography.Text>
                      )}
                      {eventItem.checkedOutAt ? (
                        <Typography.Text type="secondary">
                          Checkout lúc {dayjs(eventItem.checkedOutAt).format("HH:mm DD/MM/YYYY")}
                        </Typography.Text>
                      ) : null}
                    </Space>

                    <Button type="primary" icon={<QrcodeOutlined />} onClick={() => void onOpenQr(eventItem.id)}>
                      Lấy mã QR
                    </Button>
                    <Button type="primary" icon={<HistoryOutlined />} onClick={() => void onOpenHistory(eventItem)}>
                      Lịch sử check-in
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

      <Modal
        title="Chọn năm học"
        open={certificateModalOpen}
        okText="In giấy xác nhận"
        cancelText="Đóng"
        confirmLoading={academicYearLoading}
        onOk={onPrintCertificate}
        onCancel={() => setCertificateModalOpen(false)}
      >
        <Space direction="vertical" size="small" style={{ width: "100%" }}>
          <Typography.Text>Vui lòng chọn năm học cần in giấy xác nhận.</Typography.Text>
          <Select<number>
            style={{ width: "100%" }}
            placeholder="Chọn năm học"
            loading={academicYearLoading}
            value={selectedAcademicYearId ?? undefined}
            options={academicYearOptions.map((item) => ({ value: item.value, label: item.label }))}
            onChange={(value) => setSelectedAcademicYearId(value)}
          />
        </Space>
      </Modal>

      <Modal
        title={`Lịch sử check-in/check-out${selectedHistoryEvent ? ` - ${selectedHistoryEvent.title}` : ""}`}
        open={historyModalOpen}
        footer={null}
        onCancel={() => {
          setHistoryModalOpen(false);
          setSelectedHistoryEvent(null);
          setAttendanceHistory([]);
        }}
      >
        {historyLoading ? (
          <Typography.Text>Đang tải lịch sử điểm danh...</Typography.Text>
        ) : attendanceHistory.length === 0 ? (
          <Empty description="Bạn chưa có lịch sử check-in/check-out cho sự kiện này." />
        ) : (
          <List
            dataSource={attendanceHistory}
            renderItem={(item) => (
              <List.Item>
                <Space direction="vertical" size={4} style={{ width: "100%" }}>
                  <Space wrap>
                    <Tag color="blue">Ngày {dayjs(item.attendanceDate).format("DD/MM/YYYY")}</Tag>
                    <Tag color={item.attendanceStatus === "checked-out" ? "warning" : item.attendanceStatus === "checked-in" ? "success" : "default"}>
                      {item.attendanceStatus === "checked-out" ? "Đã checkout" : item.attendanceStatus === "checked-in" ? "Đã check-in" : "Chưa check-in"}
                    </Tag>
                  </Space>
                  <Typography.Text type="secondary">
                    {item.checkedInAt ? `Check-in: ${dayjs(item.checkedInAt).format("HH:mm DD/MM/YYYY")}` : "Check-in: Chưa có dữ liệu"}
                  </Typography.Text>
                  <Typography.Text type="secondary">
                    {item.checkedOutAt ? `Checkout: ${dayjs(item.checkedOutAt).format("HH:mm DD/MM/YYYY")}` : "Checkout: Chưa có dữ liệu"}
                  </Typography.Text>
                </Space>
              </List.Item>
            )}
          />
        )}
      </Modal>
    </Space>
  );
};

export default ProfileContent;