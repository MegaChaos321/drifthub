import { NextResponse } from 'next/server';
import clientPool from '@/lib/db'
import { validate as uuidValidate } from 'uuid';

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const { userID, role } = await request.json();

        if (!id || !uuidValidate(id)) {
            return NextResponse.json(
                { error: 'Invalid comment ID' },
                { status: 400 }
            );
        }

        if (!userID || !uuidValidate(userID)) {
            return NextResponse.json(
                { error: 'Invalid user ID' },
                { status: 400 }
            );
        }

        if(!role || !['User', 'Administrator'].includes(role)) {
            return NextResponse.json(
                { error: 'Role unknown' },
                { status: 400 }
            );
        }

        const [result] = await clientPool.query('CALL soft_delete_comment(?, ?, ?)', [
            id,
            userID,
            role
        ]);
        const { status } = result[0][0];
        
        if (status === 'NOT_FOUND') {
            return NextResponse.json(
                { error: 'Comment does not exist' },
                { status: 404 }
            );
        }

        if(status === 'FORBIDDEN'){
            return NextResponse.json(
                { error: 'Lacks permission to remove comment' },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { message: 'Comment removed successfully' },
            { status: 200 }
        );

    } catch (error) {
        console.error('Error removing comment:', error);
        return NextResponse.json(
            { error: 'Internal server error. Please try again.' },
            { status: 500 }
        );
    }
}

export async function PUT(request, { params }) {
  try {
        const { id } = await params;
        const { userID, role, text } = await request.json();

        if(!text || text.trim() == ''){
            return NextResponse.json(
                { error: 'Text is required' },
                { status: 400 }
            );
        }

        if (!id || !uuidValidate(id)) {
            return NextResponse.json(
                { error: 'Invalid comment ID' },
                { status: 400 }
            );
        }

        if (!userID || !uuidValidate(userID)) {
            return NextResponse.json(
                { error: 'Invalid user ID' },
                { status: 400 }
            );
        }

        if(!role || !['User', 'Administrator'].includes(role)) {
            return NextResponse.json(
                { error: 'Role unknown' },
                { status: 400 }
            );
        }

        const [result] = await clientPool.query('CALL update_comment(?, ?, ?, ?)', [
            id,
            userID,
            role,
            text
        ]);
        const { status } = result[0][0];
        
        if (status === 'NOT_FOUND') {
            return NextResponse.json(
                { error: 'Comment does not exist' },
                { status: 404 }
            );
        }

        if(status === 'FORBIDDEN'){
            return NextResponse.json(
                { error: 'Lacks permission to update comment' },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { 
                message: 'Comment updated successfully',
            },
            { status: 200 }
        );
  } catch (error) {
        console.error('Error updating comment:', error);
        return NextResponse.json(
            { error: 'Internal server error. Please try again.' },
            { status: 500 }
        );
  }
}
