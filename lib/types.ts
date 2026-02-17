import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'driver' | 'hotel_manager';

export interface UserProfile {
    uid: string;
    email: string;
    password?: string; // Storing strictly for the requested "custom auth" mechanism
    name: string;
    role: UserRole;
    assignedHotels?: string[]; // Hotel IDs (for Drivers/Managers)
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

export type LoadStatus = 'collected' | 'processing' | 'dropped';

export interface Load {
    id: string;
    hotelId: string;
    driverId: string;
    status: LoadStatus;
    collectedAt: Timestamp;
    droppedAt?: Timestamp;
    items: LoadItem[];
    notes?: string;
}
