"use client";

import { apiAcademicYearOptions } from "@/app/services/academicYear";
import { getCurrentUser } from "@/app/services/auth";
import { apiMyEventList } from "@/app/services/event";
import { apiStudentProfile } from "@/app/services/student";
import { StudentProfile } from "@/typings/student";
import { Document, Font, Page, PDFViewer, StyleSheet, Text, View } from "@react-pdf/renderer";
import { Alert, Spin, Typography } from "antd";
import dayjs from "dayjs";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

type CertificateRow = {
    stt: number;
    content: string;
    description: string;
    yes: string;
    no: string;
};

Font.register({
    family: "TimesNewRoman",
    fonts: [
        {
            src: 'https://api.exam.dhhp.edu.vn/fonts/font-times-new-roman/SVN-Times New Roman 2.ttf',
            fontWeight: 400
        },
        {
            src: 'https://api.exam.dhhp.edu.vn/fonts/font-times-new-roman/SVN-Times New Roman 2 bold.ttf',
            fontWeight: 700
        }
    ]
});

const styles = StyleSheet.create({
    page: {
        paddingTop: 50,
        paddingBottom: 52,
        paddingHorizontal: 48,
        fontSize: 11,
        fontFamily: "TimesNewRoman",
        lineHeight: 1.5,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    headerBlock: {
        width: "48%",
        textAlign: "center",
    },
    headerStrong: {
        fontSize: 13,
        fontWeight: "bold",
        textTransform: "uppercase",
    },
    headerSmall: {
        fontSize: 13,
        marginTop: 2,
    },
    underline: {
        marginTop: 4,
        textDecoration: "underline",
        fontSize: 13,
    },
    dateLine: {
        marginTop: 8,
        fontSize: 13,
    },
    title: {
        textAlign: "center",
        fontSize: 18,
        fontWeight: "bold",
        marginTop: 8,
        marginBottom: 30,
        textTransform: "uppercase",
    },
    subtitle: {
        textAlign: "center",
        fontSize: 13,
        fontWeight: "bold",
        marginBottom: 16,
        textTransform: "uppercase",
    },
    paragraph: {
        marginBottom: 7,
        textAlign: "justify",
        textIndent: 22,
    },
    labelLine: {
        marginBottom: 4,
        fontSize: 13
    },
    table: {
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: "#000",
        marginTop: 12,
        fontSize: 13,
        marginBottom: 20,
    },
    tableRow: {
        flexDirection: "row",
    },
    tableHeaderCell: {
        fontWeight: "bold",
        backgroundColor: "#f2f2f2",
        textAlign: "center",
    },
    cellStt: {
        width: 40,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: "#000",
        padding: 6,
        textAlign: "center",
    },
    cellContent: {
        flex: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: "#000",
        padding: 6,
    },
    cellYes: {
        width: 50,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: "#000",
        padding: 6,
        textAlign: "center",
    },
    cellNo: {
        width: 50,
        borderBottomWidth: 1,
        borderColor: "#000",
        padding: 6,
        textAlign: "center",
    },
    signatureContainer: {
        marginTop: 28,
        flexDirection: "row",
        justifyContent: "flex-end",
    },
    signatureBlock: {
        width: "38%",
        alignItems: "center",
    },
    signatureRole: {
        marginTop: 2,
        fontWeight: "bold",
        textTransform: "uppercase",
    },
    signatureSpacing: {
        marginTop: 54,
        fontSize: 10,
    },
});

const CertificateDocument: React.FC<{
    studentName: string;
    className: string;
    facultyName: string;
    academicYearLabel: string;
    rows: CertificateRow[];
}> = ({ studentName, className, facultyName, academicYearLabel, rows }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.headerRow}>
                <View style={styles.headerBlock}>
                    <Text style={{
                        fontSize: 14,
                        textTransform: "uppercase"
                    }}>Thành đoàn Hải Phòng</Text>
                    <Text style={styles.headerStrong}>BCH Trường Đại học Hải Phòng</Text>
                    <Text>* * *</Text>
                </View>
                <View style={styles.headerBlock}>
                    <Text style={{
                        fontSize: 14,
                        textTransform: "uppercase",
                        textDecoration: "underline",
                        fontWeight: "bold"
                    }}>Đoàn TNCS Hồ Chí Minh</Text>
                </View>
            </View>

            <Text style={styles.title}>GIẤY XÁC NHẬN</Text>

            <Text style={styles.labelLine}>Ban Thường vụ Đoàn Thanh niên Trường Đại học Hải Phòng xác nhận:</Text>
            <Text style={styles.labelLine}>Đồng chí: {studentName}</Text>
            <Text style={styles.labelLine}>Lớp ĐH: {className}</Text>
            <Text style={styles.labelLine}>Khoa: {facultyName}</Text>
            <Text style={styles.labelLine}>Đã tham gia các hoạt động Đoàn - Hội trong năm học {academicYearLabel} cụ thể như sau:</Text>

            <View style={styles.table}>
                <View style={styles.tableRow}>
                    <Text style={[styles.cellStt, styles.tableHeaderCell]}>TT</Text>
                    <Text style={[styles.cellContent, styles.tableHeaderCell]}>Nội dung</Text>
                    <Text style={[styles.cellYes, styles.tableHeaderCell]}>Có</Text>
                    <Text style={[styles.cellNo, styles.tableHeaderCell]}>Không</Text>
                </View>

                {rows.map((row) => {
                    return (
                        <View style={styles.tableRow} key={`${row.stt}-${row.content}`}>
                            <Text style={[styles.cellStt]}>{row.stt}</Text>
                            <Text style={[styles.cellContent]}>
                                <Text style={{
                                    fontWeight: "bold",
                                }}>{row.content}</Text>
                                <Text>{row.description}</Text>
                            </Text>
                            <Text style={[styles.cellYes]}>{row.yes}</Text>
                            <Text style={[styles.cellNo]}>{row.no}</Text>
                        </View>
                    );
                })}
            </View>
            <View style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 12,
            }}>
                <View style={{
                    flex: 1,
                    fontSize: 13
                }}>
                    <View>
                        <Text>Tổng cộng: ...... ngày tình nguyện</Text>
                    </View>
                    <View>
                        <Text>Tổng số điểm quy đổi: ..... ngày</Text>
                    </View>
                    <View>
                        <Text>Ghi chú: ....................................</Text>
                    </View>
                </View>
                <View style={{
                    flex: 1,
                    textAlign: "center"
                }}>
                    <View>
                        <Text
                            style={{
                                fontSize: 12,
                            }}
                        >Hải Phòng, ngày {dayjs().date()} tháng {dayjs().month() + 1} năm {dayjs().year()}</Text>
                    </View>
                    <View>
                        <Text style={{
                            fontWeight: "bold",
                            textTransform: "uppercase",
                            fontSize: 13
                        }}>TM. BAN THƯỜNG VỤ ĐOÀN TRƯỜNG</Text>
                        <Text style={{
                            fontSize: 13,
                        }}>PHÓ BÍ THƯ</Text>
                        <Text style={{
                            marginTop: 80,
                            fontSize: 13,
                            fontWeight: "bold"
                        }}>Trần Văn Sơn</Text>
                    </View>
                </View>
            </View>
        </Page>
    </Document>
);

const CertificatePageContent: React.FC = () => {
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [currentUser, setCurrentUser] = useState<API.CurrentUser | null>(null);
    const [events, setEvents] = useState<API.MyEventItem[]>([]);
    const [academicYears, setAcademicYears] = useState<API.AcademicYearOption[]>([]);
    const [profile, setProfile] = useState<StudentProfile | null>(null);

    const selectedAcademicYearId = Number(searchParams.get("academicYearId") ?? "0");
    const selectedAcademicYearLabelFromQuery = searchParams.get("academicYearLabel") ?? "";

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const response = await apiStudentProfile();
                if (response.data.succeeded) {
                    setProfile(response.data.data);
                } else {
                    setError("Không thể tải thông tin sinh viên.");
                }
            } catch {
                setError("Không thể tải thông tin sinh viên.");
            }
        };
        void loadProfile();
    }, []);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError("");

            try {
                const [user, eventResponse, years] = await Promise.all([
                    getCurrentUser(),
                    apiMyEventList({ pageSize: 500 }),
                    apiAcademicYearOptions(),
                ]);

                if (!user) {
                    setError("Không xác định được sinh viên đăng nhập.");
                    return;
                }

                setCurrentUser(user);
                setEvents(eventResponse);
                setAcademicYears(years);
            } catch {
                setError("Không thể tạo giấy xác nhận. Vui lòng thử lại.");
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, []);

    const selectedAcademicYear = useMemo(
        () => academicYears.find((item) => item.value === selectedAcademicYearId),
        [academicYears, selectedAcademicYearId]
    );

    const academicYearLabel = selectedAcademicYear?.label ?? selectedAcademicYearLabelFromQuery ?? "-";

    const filteredEvents = useMemo(() => {
        if (!selectedAcademicYear?.startDate || !selectedAcademicYear?.endDate) {
            return events;
        }

        const start = dayjs(selectedAcademicYear.startDate);
        const end = dayjs(selectedAcademicYear.endDate);
        return events.filter((item) => {
            const eventDate = dayjs(item.startDate);
            return eventDate.isAfter(start.subtract(1, "day")) && eventDate.isBefore(end.add(1, "day"));
        });
    }, [events, selectedAcademicYear]);

    const rows: CertificateRow[] = filteredEvents.length > 0
        ? filteredEvents.map((item, index) => ({
            stt: index + 1,
            content: `${item.title}${item.startDate ? ` (${dayjs(item.startDate).format("DD/MM/YYYY")})` : ""}`,
            yes: item.isCheckedIn ? "x" : "",
            no: item.isCheckedIn ? "" : "x",
            description: item.description ? ` - ${item.description}` : "",
        }))
        : [
            {
                stt: 1,
                content: "Không có dữ liệu hoạt động trong năm học đã chọn.",
                yes: "",
                no: "x",
                description: "",
            },
        ];

    if (loading) {
        return (
            <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
                <Spin size="large" />
            </main>
        );
    }

    if (error || !currentUser) {
        return (
            <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
                <Alert type="error" message={error || "Không thể tạo giấy xác nhận."} showIcon />
            </main>
        );
    }

    return (
        <main style={{ height: "100vh" }}>
            <div style={{ padding: 12, borderBottom: "1px solid #f0f0f0" }}>
                <Typography.Text strong>Giấy xác nhận hoạt động Đoàn</Typography.Text>
            </div>
            <PDFViewer style={{ width: "100%", height: "calc(100vh - 49px)" }}>
                <CertificateDocument
                    studentName={profile?.name ?? "-"}
                    className={profile?.classCode ?? "-"}
                    facultyName={profile?.departmentName ?? "-"}
                    academicYearLabel={academicYearLabel}
                    rows={rows}
                />
            </PDFViewer>
        </main>
    );
};

const PageFallback: React.FC = () => (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
        <Spin size="large" />
    </main>
);

const CertificatePage: React.FC = () => {
    return (
        <Suspense fallback={<PageFallback />}>
            <CertificatePageContent />
        </Suspense>
    );
};

export default CertificatePage;
