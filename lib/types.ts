import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'driver' | 'hotel_manager';

export interface UserProfile {
    uid: string;
    email: string;
    password?: string;
    name: string;
    role: UserRole;
    assignedHotels?: string[];
    createdAt: Timestamp;
}

export interface Hotel {
    id: string;
    name: string;
    address: string;
    managerId?: string;
    priceList?: { [itemType: string]: number };
}

export interface LoadItem {
    type: string;
    quantity: number;
}

// 'approved' = hotel fully approved all items
// 'partial'  = hotel approved but some items are missing/remaining
export type LoadStatus = 'collected' | 'processing' | 'dropped' | 'approved' | 'partial';

export interface Load {
    id: string;
    hotelId: string;
    driverId: string;
    status: LoadStatus;
    collectedAt: Timestamp;
    droppedAt?: Timestamp;
    approvedAt?: Timestamp;
    approvedBy?: string;           // uid of hotel manager
    items: LoadItem[];
    approvedItems?: LoadItem[];    // items confirmed received
    remainingItems?: LoadItem[];   // items still missing after approval
    notes?: string;
    approvalNotes?: string;
}

// ─── Notifications ──────────────────────────────────────────────────────────
export type NotificationType =
    | 'load_collected'
    | 'load_dropped'
    | 'load_approved'
    | 'load_partial'
    | 'load_delayed';

export interface AppNotification {
    id: string;
    targetUid: string;       // recipient user uid
    targetRole?: UserRole;   // or target by role (for broadcast)
    type: NotificationType;
    title: string;
    body: string;
    loadId?: string;
    hotelId?: string;
    read: boolean;
    createdAt: Timestamp;
}
