import { NextResponse } from 'next/server';
import clientPool from '@/lib/db'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request) {
    try {
        const body = await request.json();
        const password = body.password;
        const email = body.email?.trim().toLowerCase();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const [rows] = await clientPool.query(
            'SELECT BIN_TO_UUID(id, 1) AS id, username, email, password, role, birthDate FROM users WHERE email = ? AND isDeleted = 0',
            [email]
        );

        const user = rows[0];

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return NextResponse.json({ error: 'Incorrect email or password' }, { status: 401 });
        }

        const minAge = 18;
        const today = new Date();
        const birthDate = new Date(user.birthDate);
        
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        const tokenPayload = {
            id: user.id,
            username: user.username,
            role: user.role,
            isAdult: age >= minAge
        };

        const token = jwt.sign(
            tokenPayload,
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        return NextResponse.json(
            { 
                message: 'Login was successful!',
                token
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
