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
}