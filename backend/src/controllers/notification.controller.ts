import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { createNotification } from '../services/notification.service';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        const result = await pool.query(
            'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
            [userId]
        );

        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE',
            [userId]
        );

        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const createTestNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            res.status(401).json({ success: false, message: 'User not authenticated' });
            return;
        }

        // Create sample notifications
        const sampleNotifications = [
            {
                userId,
                type: 'answer' as const,
                title: 'John Doe menjawab pertanyaan Anda',
                message: '"Bagaimana cara meningkatkan penjualan online?"',
                link: '/questions/123'
            },
            {
                userId,
                type: 'comment' as const,
                title: 'Jane Smith mengomentari jawaban Anda',
                message: '"Tips marketing untuk UMKM"',
                link: '/questions/456'
            },
            {
                userId,
                type: 'vote' as const,
                title: 'Ahmad Rizki menyukai pertanyaan Anda',
                message: '"Strategi bisnis di era digital"',
                link: '/questions/789'
            },
            {
                userId,
                type: 'system' as const,
                title: 'Selamat datang di DiskusiBisnis!',
                message: 'Terima kasih telah bergabung dengan komunitas UMKM Indonesia.',
                link: '/welcome'
            }
        ];

        for (const notification of sampleNotifications) {
            await createNotification(notification);
        }

        res.json({ success: true, message: 'Test notifications created successfully' });
    } catch (error) {
        console.error('Error creating test notifications:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
