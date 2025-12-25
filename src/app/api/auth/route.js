import { NextResponse } from 'next/server';
import { registerUser, loginUser, getUserFromRequest } from '@/lib/auth';

export async function POST(request) {
    try {
        const body = await request.json();
        const { action, name, email, password } = body;

        if (action === 'register') {
            if (!name || !email || !password) {
                return NextResponse.json(
                    { error: 'Name, email and password are required' },
                    { status: 400 }
                );
            }

            const result = await registerUser(name, email, password);
            return NextResponse.json({
                user: {
                    id: result.user.id,
                    name: result.user.name,
                    email: result.user.email,
                    default_currency: result.user.default_currency,
                    subscription_status: result.user.subscription_status
                },
                token: result.token
            });

        } else if (action === 'login') {
            if (!email || !password) {
                return NextResponse.json(
                    { error: 'Email and password are required' },
                    { status: 400 }
                );
            }

            const result = await loginUser(email, password);
            return NextResponse.json({
                user: {
                    id: result.user.id,
                    name: result.user.name,
                    email: result.user.email,
                    default_currency: result.user.default_currency,
                    subscription_status: result.user.subscription_status,
                    avatar_url: result.user.avatar_url
                },
                token: result.token
            });

        } else {
            return NextResponse.json(
                { error: 'Invalid action. Use "login" or "register"' },
                { status: 400 }
            );
        }

    } catch (error) {
        console.error('Auth error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 401 }
        );
    }
}

export async function GET(request) {
    try {
        const user = getUserFromRequest(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                default_currency: user.default_currency,
                timezone: user.timezone,
                subscription_status: user.subscription_status,
                avatar_url: user.avatar_url
            }
        });

    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
