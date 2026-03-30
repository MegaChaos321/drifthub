import { NextResponse } from 'next/server';
import clientPool from '@/lib/db'
import { validate as uuidValidate } from 'uuid';

export async function POST(request) {
    try {
        const { topicID, text, userID } = await request.json();

        if(!text){
            return NextResponse.json(
                { error: 'Text is required' },
                { status: 400 }
            );
        }

        if (!userID || !uuidValidate(userID)) {
            return NextResponse.json(
                { error: 'Invalid user ID' },
                { status: 400 }
            );
        }

        if (!topicID || !uuidValidate(topicID)) {
            return NextResponse.json(
                { error: 'Invalid topic ID' },
                { status: 400 }
            );
        }

        const [result] = await clientPool.query('CALL create_comment(?, ?, ?)', [
            text,
            topicID,
            userID
        ]);

        const newComment = result[0][0];
        return NextResponse.json(
            { 
                message: 'Comment created successfully!',
                commentId: newComment.id
            },
            { status: 201 }
        );
    } catch (error) {
        if (error.sqlState === '45000') {
            return NextResponse.json(
                { error: 'Topic does not exist' },
                { status: 409 }
            );
        }

        console.error('Error creating comment:', error);
        return NextResponse.json(
            { error: 'Internal server error. Please try again.' },
            { status: 500 }
        );
    }
}
