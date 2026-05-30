namespace API {
    interface ArticleListItem {
        id: number;
        title: string;
        thumbnail: string;
        createdDate: string;
        normalizedName: string;
    }

    interface CurrentUser {
        id?: string | number;
        userName?: string;
        firstName?: string;
        lastName?: string;
        fullName?: string;
        email?: string;
        phoneNumber?: string;
        avatar?: string;
        userType?: number;
        className?: string;
        classCode?: string;
        facultyName?: string;
        departmentName?: string;
    }

    interface AcademicYearOption {
        value: number;
        label: string;
        startDate?: string;
        endDate?: string;
    }

    interface MyEventItem {
        id: string;
        title: string;
        description?: string;
        startDate: string;
        endDate: string;
        thumbnail?: string;
        eventType?: 0 | 1; // 0 = Limited, 1 = Public
        checkedInAt?: string;
        checkedInBy?: string;
        checkedOutAt?: string;
        checkedOutBy?: string;
        isCheckedIn: boolean;
        isCheckedOut?: boolean;
    }

    interface EventQrPayload {
        eventId: string;
        userId: string;
        userName?: string;
        fullName?: string;
        qrCode: string;
    }

    interface MyEventAttendanceHistoryItem {
        attendanceDate: string;
        checkedInAt?: string;
        checkedInBy?: string;
        checkedOutAt?: string;
        checkedOutBy?: string;
        attendanceStatus?: "not-checked-in" | "checked-in" | "checked-out";
    }

    interface ContestListItem {
        id: string;
        title: string;
        description?: string;
        content?: string;
        startDate: string;
        endDate: string;
        isActive: boolean;
        isOpened: boolean;
        hasEnded: boolean;
        submissionCount: number;
        createdDate?: string;
    }

    interface ContestSubmissionItem {
        id: string;
        contestId: string;
        userId: string;
        userName: string;
        fullName?: string;
        email?: string;
        phoneNumber?: string;
        originalFileName: string;
        fileUrl: string;
        note?: string;
        status: 0 | 1 | 2;
        adminNote?: string;
        submittedAt: string;
    }
}