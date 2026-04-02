import { NextResponse } from 'next/server';
import clientPool from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { validate as uuidValidate } from 'uuid';

export async function POST(request, { params }) {
    try {
        const { id } = await params;
        const user = await verifyAuth(request);
        const { type } = await request.json();

        if (!uuidValidate(id)) {
            return NextResponse.json(
                { error: 'Invalid comment ID' },
                { status: 400 }
            );
        }

        if (!uuidValidate(user.id)) {
            return NextResponse.json(
                { error: 'Invalid user ID' },
                { status: 400 }
            );
        }

        if (!['like', 'dislike'].includes(type)) {
            return NextResponse.json(
                { error: 'Invalid reaction type' },
                { status: 400 }
            );
        }

        const [result] = await clientPool.query('CALL toggle_reaction(?, ?, ?)', [
            user.id,
            id,
            type
        ]);

        const { status } = result[0][0];

        return NextResponse.json({ 
            message: `Reaction ${status.toLowerCase()}`, 
            status 
        }, { status: 200 });

    } catch (error) {
        console.error('Reaction error:', error);
        
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