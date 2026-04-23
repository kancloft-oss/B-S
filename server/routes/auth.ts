import express from 'express';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';

export const authRouter = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-12345';

// Configure Mail.ru SMTP transporter using environment variables
const getTransporter = () => {
    return nodemailer.createTransport({
        host: 'smtp.mail.ru',
        port: 465,
        secure: true,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
        }
    });
};

// Generates a 6-digit code
const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

authRouter.post('/send-code', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || !email.includes('@')) {
            return res.status(400).json({ error: 'Некорректный email' });
        }

        if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
            return res.status(500).json({ error: 'На сервере не настроена почта (MAIL_USER, MAIL_PASS)' });
        }

        const code = generateCode();
        // Expires in 10 minutes
        const expires = new Date(Date.now() + 10 * 60000).toISOString();

        // Save code to DB
        await db.query(`
            INSERT INTO auth_codes (email, code, expires)
            VALUES ($1, $2, $3)
            ON CONFLICT (email) DO UPDATE SET
            code = EXCLUDED.code, expires = EXCLUDED.expires
        `, [email, code, expires]);

        const transporter = getTransporter();
        
        await transporter.sendMail({
            from: process.env.MAIL_USER,
            to: email,
            subject: 'Код авторизации на сайте',
            text: `Ваш код для входа: ${code}. Никому его не сообщайте.`,
            html: `<div style="font-family: sans-serif; padding: 20px;">
                     <h2>Вход на сайт</h2>
                     <p>Ваш код для авторизации:</p>
                     <h1 style="color: #D10000; letter-spacing: 2px;">${code}</h1>
                     <p style="color: #666; font-size: 14px;">Код действует 10 минут. Если вы не запрашивали код, проигнорируйте это письмо.</p>
                   </div>`
        });

        res.json({ success: true, message: 'Код отправлен' });
    } catch (error: any) {
        console.error('Email send error:', error);
        res.status(500).json({ error: 'Ошибка отправки почты. Проверьте настройки SMTP.' });
    }
});

authRouter.post('/verify-code', async (req, res) => {
    try {
        const { email, code } = req.body;
        
        const result = await db.query('SELECT * FROM auth_codes WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Код не запрашивался' });
        }

        const authCode = result.rows[0];
        
        if (authCode.code !== code) {
            return res.status(400).json({ error: 'Неверный код' });
        }

        if (new Date(authCode.expires) < new Date()) {
            return res.status(400).json({ error: 'Код устарел' });
        }

        // Delete used code
        await db.query('DELETE FROM auth_codes WHERE email = $1', [email]);

        // Find or create user
        let userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        let user;

        if (userResult.rows.length === 0) {
            const userId = 'user_' + Date.now();
            await db.query(
                'INSERT INTO users (id, email, role, "createdAt") VALUES ($1, $2, $3, $4)',
                [userId, email, 'user', new Date().toISOString()]
            );
            user = { id: userId, email, role: 'user' };
        } else {
            user = userResult.rows[0];
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ success: true, token, user });
    } catch (error: any) {
        console.error('Verify error:', error);
        res.status(500).json({ error: 'Ошибка верификации' });
    }
});

authRouter.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Неавторизован' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        const userResult = await db.query('SELECT id, email, role, "fullName", phone, address, "avatarUrl", "backgroundUrl", theme, "bonusPoints", "bonusHistory", rating FROM users WHERE id = $1', [decoded.id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        res.json({ user: userResult.rows[0] });
    } catch (error) {
        res.status(401).json({ error: 'Недействительный токен' });
    }
});

authRouter.put('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Неавторизован' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        const { fullName, phone, address, avatarUrl, backgroundUrl, theme } = req.body;

        await db.query(`
            UPDATE users 
            SET "fullName" = $1, phone = $2, address = $3, "avatarUrl" = $4, "backgroundUrl" = $5, theme = $6
            WHERE id = $7
        `, [fullName, phone, address, avatarUrl, backgroundUrl, theme, decoded.id]);

        const userResult = await db.query('SELECT id, email, role, "fullName", phone, address, "avatarUrl", "backgroundUrl", theme, "bonusPoints", "bonusHistory", rating FROM users WHERE id = $1', [decoded.id]);
        
        res.json({ user: userResult.rows[0], success: true });
    } catch (error) {
        res.status(401).json({ error: 'Ошибка обновления профиля' });
    }
});
