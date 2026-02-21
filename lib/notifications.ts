import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { NotificationType, UserRole } from './types';

interface CreateNotificationParams {
    targetUid: string;
    targetRole?: UserRole;
    type: NotificationType;
    title: string;
    body: string;
    loadId?: string;
    hotelId?: string;
}

export async function createNotification(params: CreateNotificationParams) {
    try {
        await addDoc(collection(db, 'notifications'), {
            ...params,
            read: false,
            createdAt: serverTimestamp(),
        });
    } catch (err) {
        // Notifications are non-critical — log but don't throw
        console.error('Failed to create notification:', err);
    }
}

/**
 * Broadcast a notification to ALL users of a given role.
 * Fetches those users and creates one notification doc per user.
 */
export async function broadcastNotification(
    params: Omit<CreateNotificationParams, 'targetUid'>,
    targetUids: string[]
) {
    await Promise.all(
        targetUids.map(uid =>
            createNotification({ ...params, targetUid: uid })
        )
    );
}
