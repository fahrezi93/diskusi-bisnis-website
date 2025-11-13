import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { sort = 'reputation' } = req.query;
        
        // Safe query construction
        let query = `
            SELECT 
                id, 
                display_name as "displayName", 
                email,
                avatar_url as "avatarUrl", 
                reputation_points as "reputationPoints", 
                role,
                bio,
                created_at as "createdAt",
                (SELECT COUNT(*) FROM questions WHERE author_id = users.id) as "questionsCount",
                (SELECT COUNT(*) FROM answers WHERE author_id = users.id) as "answersCount"
            FROM users 
            WHERE is_banned = FALSE 
        `;

        // Add ORDER BY clause safely
        if (sort === 'newest') {
            query += ' ORDER BY created_at DESC';
        } else if (sort === 'name') {
            query += ' ORDER BY display_name ASC';
        } else {
            query += ' ORDER BY reputation_points DESC';
        }
        
        query += ' LIMIT 50';

        const result = await pool.query(query);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
};

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT id, display_name, avatar_url, bio, reputation_points, created_at 
             FROM public.users WHERE id = $1 AND is_banned = FALSE`,
            [id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { displayName, bio, avatarUrl } = req.body;
        const userId = req.user?.id;

        if (id !== userId) {
            res.status(403).json({ success: false, message: 'Not authorized' });
            return;
        }

        const result = await pool.query(
            `UPDATE public.users SET display_name = $1, bio = $2, avatar_url = $3, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $4 RETURNING id, display_name, avatar_url, bio, reputation_points`,
            [displayName, bio, avatarUrl, id]
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getUserQuestions = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT q.*, COUNT(a.id) as answers_count 
             FROM questions q 
             LEFT JOIN answers a ON q.id = a.question_id 
             WHERE q.author_id = $1 
             GROUP BY q.id 
             ORDER BY q.created_at DESC`,
            [id]
        );

        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getUserAnswers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT a.*, q.title as question_title, q.id as question_id 
             FROM answers a 
             JOIN questions q ON a.question_id = q.id 
             WHERE a.author_id = $1 
             ORDER BY a.created_at DESC`,
            [id]
        );

        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Function to create sample users for testing
export const createSampleUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const sampleUsers = [
            {
                email: 'budi@umkm.com',
                display_name: 'Budi Santoso',
                bio: 'Pemilik warung makan tradisional di Jakarta. Berpengalaman 10 tahun dalam bisnis kuliner.',
                reputation_points: 150,
                role: 'member'
            },
            {
                email: 'sari@umkm.com',
                display_name: 'Sari Dewi',
                bio: 'Pengusaha fashion hijab online. Memulai bisnis dari rumah dan kini memiliki toko offline.',
                reputation_points: 200,
                role: 'member'
            },
            {
                email: 'ahmad@umkm.com',
                display_name: 'Ahmad Rizki',
                bio: 'Konsultan UMKM dan digital marketing. Membantu UMKM go digital sejak 2018.',
                reputation_points: 350,
                role: 'member'
            },
            {
                email: 'rina@umkm.com',
                display_name: 'Rina Handayani',
                bio: 'Pemilik toko kue dan bakery. Spesialis kue tradisional dan modern.',
                reputation_points: 120,
                role: 'member'
            },
            {
                email: 'doni@umkm.com',
                display_name: 'Doni Pratama',
                bio: 'Pengrajin furniture kayu. Menerima pesanan custom dan ready stock.',
                reputation_points: 180,
                role: 'member'
            }
        ];

        for (const user of sampleUsers) {
            await pool.query(
                `INSERT INTO users (email, display_name, bio, reputation_points, role, email_verified) 
                 VALUES ($1, $2, $3, $4, $5, true) 
                 ON CONFLICT (email) DO NOTHING`,
                [user.email, user.display_name, user.bio, user.reputation_points, user.role]
            );
        }

        res.json({ 
            success: true, 
            message: 'Sample users created successfully',
            count: sampleUsers.length
        });
    } catch (error) {
        console.error('Error creating sample users:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
};
