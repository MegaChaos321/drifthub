import { NextResponse } from 'next/server';
import clientPool from '@/lib/db'
import bcrypt from 'bcryptjs';

export async function POST(request) {
    try {
        const body = await request.json();
        const password = body.password;
        const email = body.email?.trim().toLowerCase();

        if (!email || !password) {
        return NextResponse.json(
            { error: 'Email and password are required' },
            { status: 400 }
        );
        }

        const [rows] = await clientPool.query(
            'SELECT BIN_TO_UUID(id, 1) AS id, username, email, password, role FROM users WHERE email = ? AND isDeleted = 0',
            [email]
        );

        const user = rows[0];

        if (!user) {
        return NextResponse.json(
                { error: 'Incorrect email or password' },
                { status: 401 }
            );
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
        return NextResponse.json(
                { error: 'Incorrect email or password' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { 
                message: 'Login was successful!',
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    role: user.role
                }
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error. Please try again.' },
            { status: 500 }
        );
    }
}
