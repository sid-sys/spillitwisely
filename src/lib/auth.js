import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { queryOne, insert, run } from './db/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'splitwise-clone-secret-key-change-in-production';
const TOKEN_EXPIRY = '7d';

export function hashPassword(password) {
    return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password, hash) {
    return bcrypt.compareSync(password, hash);
}

export function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            name: user.name,
            subscription_status: user.subscription_status
        },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
    );
}

export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
}

export function getUserFromRequest(request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) return null;

    // Get fresh user data
    const user = queryOne('SELECT * FROM users WHERE id = ?', [decoded.id]);
    return user;
}

export function requireAuth(request) {
    const user = getUserFromRequest(request);
    if (!user) {
        throw new Error('Unauthorized');
    }
    return user;
}

export async function registerUser(name, email, password) {
    const existing = queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
        throw new Error('Email already registered');
    }

    const passwordHash = hashPassword(password);
    const userId = insert(
        'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
        [name, email, passwordHash]
    );

    // Create default notification preferences
    run('INSERT INTO notification_preferences (user_id) VALUES (?)', [userId]);

    const user = queryOne('SELECT * FROM users WHERE id = ?', [userId]);
    return { user, token: generateToken(user) };
}

export async function loginUser(email, password) {
    const user = queryOne('SELECT * FROM users WHERE email = ?', [email]);

    if (!user || !verifyPassword(password, user.password_hash)) {
        throw new Error('Invalid email or password');
    }

    return { user, token: generateToken(user) };
}
