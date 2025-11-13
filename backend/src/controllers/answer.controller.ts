import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { createAnswerNotification } from '../services/notification.service';

export const createAnswer = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { content, questionId } = req.body;
        const userId = req.user?.id;

        const result = await pool.query(
            `INSERT INTO answers (content, question_id, author_id) 
             VALUES ($1, $2, $3) RETURNING *`,
            [content, questionId, userId]
        );

        // Update question answers count
        await pool.query(
            'UPDATE questions SET answers_count = answers_count + 1 WHERE id = $1',
            [questionId]
        );

        // Get question details and author info for notification
        const questionResult = await pool.query(
            `SELECT q.title, q.author_id, u.display_name as answerer_name
             FROM questions q, users u
             WHERE q.id = $1 AND u.id = $2`,
            [questionId, userId]
        );

        if (questionResult.rows.length > 0) {
            const question = questionResult.rows[0];
            // Only send notification if answerer is not the question author
            if (question.author_id !== userId) {
                try {
                    await createAnswerNotification(
                        question.author_id,
                        question.answerer_name,
                        question.title,
                        questionId
                    );
                } catch (notifError) {
                    console.error('Error creating answer notification:', notifError);
                    // Don't fail the answer creation if notification fails
                }
            }
        }

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateAnswer = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.user?.id;

        const checkResult = await pool.query('SELECT author_id FROM answers WHERE id = $1', [id]);
        if (checkResult.rows.length === 0 || checkResult.rows[0].author_id !== userId) {
            res.status(403).json({ success: false, message: 'Not authorized' });
            return;
        }

        const result = await pool.query(
            'UPDATE answers SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [content, id]
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deleteAnswer = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const checkResult = await pool.query('SELECT author_id, question_id FROM answers WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Answer not found' });
            return;
        }

        if (checkResult.rows[0].author_id !== userId && req.user?.role !== 'admin') {
            res.status(403).json({ success: false, message: 'Not authorized' });
            return;
        }

        await pool.query('DELETE FROM answers WHERE id = $1', [id]);
        await pool.query(
            'UPDATE questions SET answers_count = answers_count - 1 WHERE id = $1',
            [checkResult.rows[0].question_id]
        );

        res.json({ success: true, message: 'Answer deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const acceptAnswer = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        // Get answer and question
        const answerResult = await pool.query(
            `SELECT a.*, q.author_id as question_author_id 
             FROM answers a 
             JOIN questions q ON a.question_id = q.id 
             WHERE a.id = $1`,
            [id]
        );

        if (answerResult.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Answer not found' });
            return;
        }

        const answer = answerResult.rows[0];

        // Only question author can accept answers
        if (answer.question_author_id !== userId) {
            res.status(403).json({ success: false, message: 'Only question author can accept answers' });
            return;
        }

        // Unaccept any previously accepted answer
        await pool.query(
            'UPDATE answers SET is_accepted = FALSE WHERE question_id = $1',
            [answer.question_id]
        );

        // Accept this answer
        await pool.query(
            'UPDATE answers SET is_accepted = TRUE, accepted_at = CURRENT_TIMESTAMP WHERE id = $1',
            [id]
        );

        // Update question
        await pool.query(
            'UPDATE questions SET has_accepted_answer = TRUE WHERE id = $1',
            [answer.question_id]
        );

        // Add reputation to answer author (+15 points handled by trigger)

        res.json({ success: true, message: 'Answer accepted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
