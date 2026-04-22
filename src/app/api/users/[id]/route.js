import { NextResponse } from 'next/server';
import clientPool from '@/lib/db'
import { verifyAuth } from '@/lib/auth';
import { validate as uuidValidate } from 'uuid';
import jwt from 'jsonwebtoken';

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        let userID = null;
        let userRole = '';

        try {
            const user = await verifyAuth(request);
            if (user) {
                userID = user.id;
                userRole = user.role;
            }
        } catch (authError) {
            userID = null;
            userRole = 'Guest';
        }

        if (!id || !uuidValidate(id)) {
            return NextResponse.json(
                { error: 'Invalid user profile ID' },
                { status: 404 }
            );
        }

        if (userID && !uuidValidate(userID)) {
            return NextResponse.json(
                { error: 'Invalid user ID' },
                { status: 400 }
            );
        }

        if(!['User', 'Administrator', 'Guest'].includes(userRole)) {
            return NextResponse.json(
                { error: 'Role unknown' },
                { status: 400 }
            );
        }

        const [result] = await clientPool.query('CALL get_user_profile(?, ?, ?)', [
            id,
            userID,
            userRole
        ]);

        const profile = result[0][0];

        if (!profile) {
            return NextResponse.json(
                { error: 'User profile not found' },
                { status: 404 }
            );
        }

        const rawDate = profile.birthDate;

        let finalDate = rawDate;
        if (rawDate instanceof Date) {
            const offset = rawDate.getTimezoneOffset();
            const correctedDate = new Date(rawDate.getTime() - (offset * 60 * 1000));
            finalDate = correctedDate.toISOString().split('T')[0];
        }

        return NextResponse.json(
            {
                userProfile: {
                    id: profile.id,
                    username: profile.username,
                    email: profile.email,
                    role: profile.role,
                    birthDate: finalDate,
                    createdAt: profile.createdAt,
                    bio: profile.bio ? profile.bio : '',
                    profileImage: profile.profileImage || null,
                    showEmail: Boolean(profile.showEmail),
                    showBirthDate: Boolean(profile.showBirthDate)
                }
            }
        )
    } catch (error) {
        console.error('Error fetching user profile:', error)
        return NextResponse.json(
            { error: 'Internal server error. Please try again.' },
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const user = await verifyAuth(request);

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

        const [result] = await clientPool.query('CALL soft_delete_user(?, ?, ?)', [
            id,
            user.id,
            user.role
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
                { error: 'Lacks permission to delete user' },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { message: 'User deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error deleting user:', error);

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

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const user = await verifyAuth(request);
        const body = await request.json();
        const { username, birthDate } = body;
        const email = body.email?.trim().toLowerCase();

        if (!username || !email || !birthDate) {
            return NextResponse.json(
                { error: 'These fields cannot be empty' },
                { status: 400 }
            );
        }

        const birthDateObj = new Date(birthDate);
        if (isNaN(birthDateObj.getTime()) || birthDateObj > new Date() || birthDateObj < new Date('1900-01-01')) {
            return NextResponse.json(
                { error: 'Invalid date of birth' },
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

        const [result] = await clientPool.query('CALL update_user(?, ?, ?, ?, ?, ?)', [
            id,
            user.id,
            user.role,
            username,
            birthDate,
            email
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
                { error: 'Lacks permission to update user' },
                { status: 403 }
            );
        }

        if(status === 'USERNAME_TAKEN'){
            return NextResponse.json(
                { error: 'Username is already taken' },
                { status: 409 }
            );
        }

        if(status === 'EMAIL_TAKEN'){
            return NextResponse.json(
                { error: 'Email has already been registered' },
                { status: 409 }
            );
        }

        if(id === user.id) {
            const minAge = 18;
            const today = new Date();
            const newbirthDate = new Date(birthDate);
            
            let age = today.getFullYear() - newbirthDate.getFullYear();
            const monthDiff = today.getMonth() - newbirthDate.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < newbirthDate.getDate())) {
                age--;
            }

            const tokenPayload = {
                id: user.id,
                username: username,
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
                    message: 'User updated successfully',
                    token
                },
                { status: 200 }
            );
        }

        return NextResponse.json(
            { 
                message: 'User updated successfully'
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error updating user:', error);

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
