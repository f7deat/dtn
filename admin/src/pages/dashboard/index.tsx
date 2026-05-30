import { apiArticleList } from "@/services/article";
import { apiContestList } from "@/services/contest";
import { apiContestSubmissionList } from "@/services/contest";
import { apiEventList } from "@/services/event";
import { apiStudentList } from "@/services/student";
import { ReloadOutlined } from "@ant-design/icons";
import { PageContainer, ProCard } from "@ant-design/pro-components";
import { Alert, Button, Col, Progress, Row, Space, Statistic, Table, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";

type EventItem = {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    registrationCount?: number;
    checkedInCount?: number;
    checkedOutCount?: number;
};

type ContestItem = {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    isOpened: boolean;
    hasEnded: boolean;
    submissionCount?: number;
};

type DashboardData = {
    studentTotal: number;
    articleTotal: number;
    eventTotal: number;
    contestTotal: number;
    events: EventItem[];
    contests: ContestItem[];
    submissions: SubmissionItem[];
};

type SubmissionItem = {
    id: string;
    contestId: string;
    submittedAt: string;
};

type TrendPoint = {
    label: string;
    value: number;
};

function parseListResponse<T>(response: any): { data: T[]; total: number } {
    const directData = response?.data;

    if (Array.isArray(directData)) {
        return {
            data: directData,
            total: Number(response?.total ?? response?.totalCount ?? directData.length),
        };
    }

    if (Array.isArray(response)) {
        return {
            data: response,
            total: response.length,
        };
    }

    const nestedData = directData?.data;
    if (Array.isArray(nestedData)) {
        return {
            data: nestedData,
            total: Number(directData?.total ?? directData?.totalCount ?? nestedData.length),
        };
    }

    const items = response?.items ?? directData?.items;
    if (Array.isArray(items)) {
        return {
            data: items,
            total: Number(response?.total ?? response?.totalCount ?? directData?.total ?? directData?.totalCount ?? items.length),
        };
    }

    return { data: [], total: 0 };
}

const Index: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();
    const [lastUpdated, setLastUpdated] = useState<string>();
    const [dashboardData, setDashboardData] = useState<DashboardData>({
        studentTotal: 0,
        articleTotal: 0,
        eventTotal: 0,
        contestTotal: 0,
        events: [],
        contests: [],
        submissions: [],
    });

    const loadDashboard = useCallback(async () => {
        try {
            setLoading(true);
            setError(undefined);

            const [studentResponse, articleResponse, eventResponse, contestResponse] = await Promise.all([
                apiStudentList({ current: 1, pageSize: 1 }),
                apiArticleList({ current: 1, pageSize: 1 }),
                apiEventList({ current: 1, pageSize: 200 }),
                apiContestList({ current: 1, pageSize: 200 }),
            ]);

            const students = parseListResponse(studentResponse);
            const articles = parseListResponse(articleResponse);
            const events = parseListResponse<EventItem>(eventResponse);
            const contests = parseListResponse<ContestItem>(contestResponse);

            const contestsWithSubmission = contests.data.filter((contest) => Number(contest.submissionCount ?? 0) > 0);
            const submissionResponses = await Promise.allSettled(
                contestsWithSubmission.slice(0, 30).map((contest) => apiContestSubmissionList(contest.id, { current: 1, pageSize: 5000 }))
            );

            const submissions = submissionResponses.flatMap((response) => {
                if (response.status !== "fulfilled") {
                    return [];
                }
                return parseListResponse<SubmissionItem>(response.value).data;
            });

            setDashboardData({
                studentTotal: students.total,
                articleTotal: articles.total,
                eventTotal: events.total,
                contestTotal: contests.total,
                events: events.data,
                contests: contests.data,
                submissions,
            });

            setLastUpdated(dayjs().format("HH:mm:ss DD/MM/YYYY"));
        } catch (loadError: any) {
            setError(loadError?.message ?? "Không thể tải dữ liệu thống kê");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const eventMetrics = useMemo(() => {
        const today = dayjs();

        const ongoing = dashboardData.events.filter((event) => {
            const start = dayjs(event.startDate);
            const end = dayjs(event.endDate);
            return start.isValid() && end.isValid() && (today.isAfter(start, "day") || today.isSame(start, "day")) && (today.isBefore(end, "day") || today.isSame(end, "day"));
        }).length;

        const upcoming = dashboardData.events.filter((event) => dayjs(event.startDate).isAfter(today, "day")).length;
        const ended = dashboardData.events.filter((event) => dayjs(event.endDate).isBefore(today, "day")).length;

        const totalRegistrations = dashboardData.events.reduce((sum, event) => sum + Number(event.registrationCount ?? 0), 0);
        const totalCheckedIn = dashboardData.events.reduce((sum, event) => sum + Number(event.checkedInCount ?? 0), 0);
        const attendanceRate = totalRegistrations > 0 ? Math.round((totalCheckedIn / totalRegistrations) * 100) : 0;

        return {
            ongoing,
            upcoming,
            ended,
            totalRegistrations,
            totalCheckedIn,
            attendanceRate,
        };
    }, [dashboardData.events]);

    const contestMetrics = useMemo(() => {
        const active = dashboardData.contests.filter((contest) => contest.isActive).length;
        const opened = dashboardData.contests.filter((contest) => contest.isOpened).length;
        const ended = dashboardData.contests.filter((contest) => contest.hasEnded).length;
        const totalSubmissions = dashboardData.contests.reduce((sum, contest) => sum + Number(contest.submissionCount ?? 0), 0);

        return {
            active,
            opened,
            ended,
            totalSubmissions,
        };
    }, [dashboardData.contests]);

    const topEvents = useMemo(
        () => [...dashboardData.events]
            .sort((a, b) => Number(b.registrationCount ?? 0) - Number(a.registrationCount ?? 0))
            .slice(0, 5),
        [dashboardData.events],
    );

    const topContests = useMemo(
        () => [...dashboardData.contests]
            .sort((a, b) => Number(b.submissionCount ?? 0) - Number(a.submissionCount ?? 0))
            .slice(0, 5),
        [dashboardData.contests],
    );

    const eventTrendByMonth = useMemo<TrendPoint[]>(() => {
        const monthMap = new Map<string, number>();

        dashboardData.events.forEach((event) => {
            const date = dayjs(event.startDate);
            if (!date.isValid()) {
                return;
            }
            const key = date.startOf("month").format("YYYY-MM");
            monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
        });

        return Array.from(monthMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-6)
            .map(([key, value]) => ({
                label: dayjs(`${key}-01`).format("MM/YYYY"),
                value,
            }));
    }, [dashboardData.events]);

    const submissionTrendByMonth = useMemo<TrendPoint[]>(() => {
        const monthMap = new Map<string, number>();

        dashboardData.submissions.forEach((submission) => {
            const date = dayjs(submission.submittedAt);
            if (!date.isValid()) {
                return;
            }
            const key = date.startOf("month").format("YYYY-MM");
            monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
        });

        const monthlyPoints = Array.from(monthMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-6)
            .map(([key, value]) => ({
                label: dayjs(`${key}-01`).format("MM/YYYY"),
                value,
            }));

        let cumulative = 0;
        return monthlyPoints.map((point) => {
            cumulative += point.value;
            return {
                label: point.label,
                value: cumulative,
            };
        });
    }, [dashboardData.submissions]);

    const barMaxValue = useMemo(() => Math.max(...eventTrendByMonth.map((point) => point.value), 1), [eventTrendByMonth]);
    const lineMaxValue = useMemo(() => Math.max(...submissionTrendByMonth.map((point) => point.value), 1), [submissionTrendByMonth]);

    const linePoints = useMemo(() => {
        if (submissionTrendByMonth.length === 0) {
            return "";
        }

        const width = 600;
        const height = 220;
        const padding = 24;
        const stepX = submissionTrendByMonth.length > 1
            ? (width - padding * 2) / (submissionTrendByMonth.length - 1)
            : 0;

        return submissionTrendByMonth
            .map((point, index) => {
                const x = padding + index * stepX;
                const y = height - padding - (point.value / lineMaxValue) * (height - padding * 2);
                return `${x},${y}`;
            })
            .join(" ");
    }, [submissionTrendByMonth, lineMaxValue]);

    return (
        <PageContainer
            title="Báo cáo thống kê"
            extra={[
                <Space key="toolbar" size={12}>
                    {lastUpdated && <Typography.Text type="secondary">Cập nhật: {lastUpdated}</Typography.Text>}
                    <Button icon={<ReloadOutlined />} loading={loading} onClick={loadDashboard}>
                        Làm mới
                    </Button>
                </Space>,
            ]}
        >
            {error && (
                <Alert
                    className="mb-4"
                    type="error"
                    showIcon
                    message="Không tải được dữ liệu thống kê"
                    description={error}
                />
            )}

            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <ProCard loading={loading}>
                        <Statistic title="Tổng sinh viên" value={dashboardData.studentTotal} />
                    </ProCard>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <ProCard loading={loading}>
                        <Statistic title="Tổng bài viết" value={dashboardData.articleTotal} />
                    </ProCard>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <ProCard loading={loading}>
                        <Statistic title="Tổng sự kiện" value={dashboardData.eventTotal} />
                    </ProCard>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <ProCard loading={loading}>
                        <Statistic title="Tổng cuộc thi" value={dashboardData.contestTotal} />
                    </ProCard>
                </Col>
            </Row>

            <Row gutter={[16, 16]} className="mt-4">
                <Col xs={24} lg={12}>
                    <ProCard title="Thống kê sự kiện" loading={loading}>
                        <Row gutter={[16, 16]}>
                            <Col span={8}><Statistic title="Đang diễn ra" value={eventMetrics.ongoing} /></Col>
                            <Col span={8}><Statistic title="Sắp diễn ra" value={eventMetrics.upcoming} /></Col>
                            <Col span={8}><Statistic title="Đã kết thúc" value={eventMetrics.ended} /></Col>
                        </Row>
                        <Row gutter={[16, 16]} className="mt-2">
                            <Col span={12}><Statistic title="Đăng ký" value={eventMetrics.totalRegistrations} /></Col>
                            <Col span={12}><Statistic title="Check-in" value={eventMetrics.totalCheckedIn} /></Col>
                        </Row>
                        <div className="mt-3">
                            <Typography.Text>Tỷ lệ check-in trung bình</Typography.Text>
                            <Progress percent={eventMetrics.attendanceRate} status="active" />
                        </div>
                    </ProCard>
                </Col>

                <Col xs={24} lg={12}>
                    <ProCard title="Thống kê cuộc thi" loading={loading}>
                        <Row gutter={[16, 16]}>
                            <Col span={8}><Statistic title="Đang bật" value={contestMetrics.active} /></Col>
                            <Col span={8}><Statistic title="Đang mở nhận bài" value={contestMetrics.opened} /></Col>
                            <Col span={8}><Statistic title="Đã kết thúc" value={contestMetrics.ended} /></Col>
                        </Row>
                        <Row className="mt-2">
                            <Col span={24}><Statistic title="Tổng bài dự thi" value={contestMetrics.totalSubmissions} /></Col>
                        </Row>
                    </ProCard>
                </Col>
            </Row>

            <Row gutter={[16, 16]} className="mt-4">
                <Col xs={24} xl={12}>
                    <ProCard title="Top 5 sự kiện nhiều đăng ký" loading={loading}>
                        <Table<EventItem>
                            size="small"
                            rowKey="id"
                            pagination={false}
                            dataSource={topEvents}
                            columns={[
                                {
                                    title: "Sự kiện",
                                    dataIndex: "title",
                                    ellipsis: true,
                                },
                                {
                                    title: "Đăng ký",
                                    dataIndex: "registrationCount",
                                    width: 100,
                                    render: (value) => <Tag color="processing">{Number(value ?? 0)}</Tag>,
                                },
                                {
                                    title: "Check-in",
                                    dataIndex: "checkedInCount",
                                    width: 95,
                                    render: (value) => <Tag color="success">{Number(value ?? 0)}</Tag>,
                                },
                            ]}
                            locale={{ emptyText: "Chưa có dữ liệu" }}
                        />
                    </ProCard>
                </Col>

                <Col xs={24} xl={12}>
                    <ProCard title="Top 5 cuộc thi nhiều bài dự thi" loading={loading}>
                        <Table<ContestItem>
                            size="small"
                            rowKey="id"
                            pagination={false}
                            dataSource={topContests}
                            columns={[
                                {
                                    title: "Cuộc thi",
                                    dataIndex: "title",
                                    ellipsis: true,
                                },
                                {
                                    title: "Trạng thái",
                                    dataIndex: "isOpened",
                                    width: 130,
                                    render: (_, record) => {
                                        if (!record.isActive) return <Tag>Tạm dừng</Tag>;
                                        if (record.isOpened) return <Tag color="success">Đang mở</Tag>;
                                        if (record.hasEnded) return <Tag color="error">Đã kết thúc</Tag>;
                                        return <Tag color="gold">Sắp mở</Tag>;
                                    },
                                },
                                {
                                    title: "Bài dự thi",
                                    dataIndex: "submissionCount",
                                    width: 100,
                                    render: (value) => <Tag color="processing">{Number(value ?? 0)}</Tag>,
                                },
                            ]}
                            locale={{ emptyText: "Chưa có dữ liệu" }}
                        />
                    </ProCard>
                </Col>
            </Row>

            <Row gutter={[16, 16]} className="mt-4">
                <Col xs={24} xl={12}>
                    <ProCard title="Biểu đồ cột: Sự kiện theo tháng" loading={loading}>
                        {eventTrendByMonth.length === 0 ? (
                            <Typography.Text type="secondary">Chưa có dữ liệu để vẽ biểu đồ.</Typography.Text>
                        ) : (
                            <>
                                <div className="flex items-end gap-3 h-56">
                                    {eventTrendByMonth.map((point) => {
                                        const heightPercent = Math.max((point.value / barMaxValue) * 100, 8);
                                        return (
                                            <div key={point.label} className="flex-1 min-w-0">
                                                <div className="h-44 flex items-end justify-center bg-slate-50 rounded">
                                                    <div
                                                        className="w-10 rounded-t bg-blue-500 transition-all duration-300"
                                                        style={{ height: `${heightPercent}%` }}
                                                        title={`${point.label}: ${point.value}`}
                                                    />
                                                </div>
                                                <div className="text-center text-xs text-gray-500 mt-2 truncate">{point.label}</div>
                                                <div className="text-center text-sm font-medium">{point.value}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <Typography.Text type="secondary">Tổng số sự kiện khởi tạo theo từng tháng gần nhất.</Typography.Text>
                            </>
                        )}
                    </ProCard>
                </Col>

                <Col xs={24} xl={12}>
                    <ProCard title="Biểu đồ đường: Tăng trưởng bài dự thi" loading={loading}>
                        {submissionTrendByMonth.length === 0 ? (
                            <Typography.Text type="secondary">Chưa có dữ liệu bài dự thi theo thời gian.</Typography.Text>
                        ) : (
                            <>
                                <div className="w-full bg-slate-50 rounded p-2">
                                    <svg viewBox="0 0 600 220" className="w-full h-56" preserveAspectRatio="none">
                                        <line x1="24" y1="196" x2="576" y2="196" stroke="#d9d9d9" strokeWidth="1" />
                                        <polyline
                                            points={linePoints}
                                            fill="none"
                                            stroke="#16a34a"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        {submissionTrendByMonth.map((point, index) => {
                                            const stepX = submissionTrendByMonth.length > 1 ? (600 - 48) / (submissionTrendByMonth.length - 1) : 0;
                                            const x = 24 + index * stepX;
                                            const y = 196 - (point.value / lineMaxValue) * (220 - 48);
                                            return (
                                                <circle key={point.label} cx={x} cy={y} r="4" fill="#16a34a">
                                                    <title>{`${point.label}: ${point.value}`}</title>
                                                </circle>
                                            );
                                        })}
                                    </svg>
                                </div>
                                <div className="flex justify-between mt-2 text-xs text-gray-500">
                                    {submissionTrendByMonth.map((point) => (
                                        <span key={point.label} className="truncate max-w-20">{point.label}</span>
                                    ))}
                                </div>
                                <Typography.Text type="secondary">Đường biểu diễn tổng lũy kế bài dự thi theo thời gian nộp.</Typography.Text>
                            </>
                        )}
                    </ProCard>
                </Col>
            </Row>
        </PageContainer>
    );
};

export default Index;