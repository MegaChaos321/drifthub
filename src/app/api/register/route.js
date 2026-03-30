import { NextResponse } from 'next/server';
import clientPool from '@/lib/db'
import bcrypt from 'bcryptjs';

export async function POST(request) {
    try {
        const body = await request.json();
        const { username, password } = body;
        const email = body.email?.trim().toLowerCase();

        if (!username || !email || !password) {
            return NextResponse.json(
                { error: 'Username, email and password are required' },
                { status: 400 }
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must have at least 6 characters' },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await clientPool.query('CALL create_user(?, ?, ?)', [
            username,
            email,
            hashedPassword
        ]);

        const newUser = result[0][0];
        return NextResponse.json(
            { 
                message: 'User registered successfully!',
                userID: newUser.id
            },
            { status: 201 }
        );
    } catch (error) {
        if (error.sqlState === '45000') {
            return NextResponse.json(
                { error: 'Email has already been registered' },
                { status: 409 }
            );
        }

        console.error('Register error:', error);
        return NextResponse.json(
            { error: 'Internal server error. Please try again.' },
            { status: 500 }
        );
    }
}
