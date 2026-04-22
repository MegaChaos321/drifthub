import { NextResponse } from 'next/server';
import clientPool from '@/lib/db'
import { verifyAuth } from '@/lib/auth';
import { validate as uuidValidate } from 'uuid';

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const user = await verifyAuth(request);
        const { bio, profileImage, showEmail, showBirthDate } = await request.json();

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

        if(!['User', 'Administrator'].includes(user.role)) {
            return NextResponse.json(
                { error: 'Role unknown' },
                { status: 400 }
            );
        }

        const [result] = await clientPool.query('CALL update_user_profile(?, ?, ?, ?, ?, ?, ?)', [
            id,
            user.id,
            user.role,
            bio,
            profileImage || null,
            showEmail ? 1 : 0,
            showBirthDate ? 1 : 0
        ]);
        const { status } = result[0][0];
        
        if (status === 'NOT_FOUND') {
            return NextResponse.json(
                { error: 'User does not exist' },
                { status: 404 }
            );
        }

        if(status === 'FORBIDDEN'){
            return NextResponse.json(
                { error: 'Lacks permission to update user profile' },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { message: 'User profile updated successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error updating user profile:', error);

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
