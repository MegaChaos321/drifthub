import { NextResponse } from 'next/server';
import clientPool from '@/lib/db'
import { verifyAuth } from '@/lib/auth';
import { validate as uuidValidate } from 'uuid';

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const user = await verifyAuth(request);

        if (!id || !uuidValidate(id)) {
            return NextResponse.json(
                { error: 'Invalid topic ID' },
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

        const [result] = await clientPool.query('CALL hard_delete_topic(?, ?, ?)', [
            id,
            user.id,
            user.role
        ]);
        const { status } = result[0][0];
        
        if (status === 'NOT_FOUND') {
            return NextResponse.json(
                { error: 'Topic does not exist' },
                { status: 404 }
            );
        }

        if(status === 'FORBIDDEN'){
            return NextResponse.json(
                { error: 'Lacks permission to permanently delete topic' },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { message: 'Topic permanently deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error permanently deleting topic:', error);

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

export async function PATCH(request, { params }) {
    try {
        const { id } = await params;
        const user = await verifyAuth(request);

        if (!id || !uuidValidate(id)) {
            return NextResponse.json(
                { error: 'Invalid topic ID' },
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

        const [result] = await clientPool.query('CALL restore_topic(?, ?, ?)', [
            id,
            user.id,
            user.role
        ]);
        const { status } = result[0][0];
        
        if (status === 'NOT_FOUND') {
            return NextResponse.json(
                { error: 'Topic does not exist' },
                { status: 404 }
            );
        }

        if(status === 'FORBIDDEN'){
            return NextResponse.json(
                { error: 'Lacks permission to restore topic' },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { message: 'Topic restored successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error restoring topic:', error);

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
