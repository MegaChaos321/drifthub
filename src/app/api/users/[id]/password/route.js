import { NextResponse } from 'next/server';
import clientPool from '@/lib/db'
import { verifyAuth } from '@/lib/auth';
import { validate as uuidValidate } from 'uuid';
import bcrypt from 'bcryptjs';

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const user = await verifyAuth(request);
        const { oldPassword, newPassword } = await request.json();

        if (!id || !uuidValidate(id)) {
            return NextResponse.json(
                { error: 'Invalid user profile ID' },
                { status: 400 }
            );
        }

        if (!uuidValidate(user.id)) {
            return NextResponse.json(
                { error: 'Invalid user ID' },
                { status: 400 }
            );
        }

        if (!oldPassword || !newPassword) {
            return NextResponse.json(
                { error: 'Old and new passwords are required' },
                { status: 400 }
            );
        }

        const [rows] = await clientPool.query(
            'SELECT password FROM users WHERE id = UUID_TO_BIN(?, 1) AND isDeleted = 0',
            [id]
        );

        const userData = rows[0];

        if (!userData) {
            return NextResponse.json(
                { error: 'User does not exist' },
                { status: 404 }
            );
        }

        const isPasswordCorrect = await bcrypt.compare(oldPassword, userData.password);

        if (!isPasswordCorrect) {
            return NextResponse.json(
                { error: 'Incorrect current password' },
                { status: 401 }
            );
        }

        if(oldPassword === newPassword){
            return NextResponse.json(
                { error: 'New password cannot be the same as old password' },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const [result] = await clientPool.query('CALL update_user_password(?, ?, ?)', [
            id,
            user.id,
            hashedPassword,
        ]);
        const { status } = result[0][0];

        if(status === 'FORBIDDEN'){
            return NextResponse.json(
                { error: 'Lacks permission to update user password' },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { message: 'User password updated successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error updating password:', error);

        if (error.message === 'Unauthorized' || error.message === 'Invalid token') {
            return NextResponse.json(
                { error: 'Unauthorized access' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error. Please try again.' },
            { status: 500 }
        );
    }
}
