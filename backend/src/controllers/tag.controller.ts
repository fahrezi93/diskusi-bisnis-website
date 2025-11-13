import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAllTags = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await pool.query(
            `SELECT 
                id, 
                name, 
                slug, 
                description, 
                usage_count as "questionCount", 
                created_at as "createdAt"
            FROM tags 
            ORDER BY usage_count DESC, name ASC`
        );

        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getTagBySlug = async (req: Request, res: Response): Promise<void> => {
    try {
        const { slug } = req.params;

        const tagResult = await pool.query(
            `SELECT 
                id, 
                name, 
                slug, 
                description, 
                usage_count as "questionCount", 
                created_at as "createdAt"
            FROM tags 
            WHERE slug = $1`, 
            [slug]
        );
        
        if (tagResult.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Tag not found' });
            return;
        }

        res.json({ 
            success: true, 
            data: tagResult.rows[0]
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const createTag = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, slug, description } = req.body;
        const userId = req.user?.id;

        const result = await pool.query(
            'INSERT INTO tags (name, slug, description, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, slug, description, userId]
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateTag = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, slug, description } = req.body;

        const result = await pool.query(
            'UPDATE tags SET name = $1, slug = $2, description = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
            [name, slug, description, id]
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deleteTag = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM tags WHERE id = $1', [id]);
        res.json({ success: true, message: 'Tag deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const createSampleTags = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const sampleTags = [
            { name: 'Marketing', slug: 'marketing', description: 'Strategi pemasaran dan promosi bisnis' },
            { name: 'Keuangan', slug: 'keuangan', description: 'Pengelolaan keuangan dan akuntansi UMKM' },
            { name: 'Pajak', slug: 'pajak', description: 'Pertanyaan seputar perpajakan UMKM' },
            { name: 'Legalitas', slug: 'legalitas', description: 'Aspek hukum dan perizinan usaha' },
            { name: 'Digital', slug: 'digital', description: 'Transformasi digital dan teknologi' },
            { name: 'Ekspor', slug: 'ekspor', description: 'Perdagangan internasional dan ekspor' },
            { name: 'Startup', slug: 'startup', description: 'Memulai bisnis dan startup' },
            { name: 'Investasi', slug: 'investasi', description: 'Pencarian modal dan investasi' }
        ];

        for (const tag of sampleTags) {
            try {
                await pool.query(
                    'INSERT INTO tags (name, slug, description) VALUES ($1, $2, $3) ON CONFLICT (slug) DO NOTHING',
                    [tag.name, tag.slug, tag.description]
                );
            } catch (error) {
                // Ignore duplicate errors
                console.log(`Tag ${tag.name} already exists`);
            }
        }

        res.json({ success: true, message: 'Sample tags created successfully' });
    } catch (error) {
        console.error('Error creating sample tags:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
