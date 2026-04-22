import { NextResponse } from 'next/server';
import clientPool from '@/lib/db'
import { verifyAuth } from '@/lib/auth';
import { validate as uuidValidate } from 'uuid';

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        let userID = null;

        if (!id || !uuidValidate(id)) {
            return NextResponse.json(
                { error: 'Invalid topic ID' },
                { status: 404 }
            );
        }

        try {
            const user = await verifyAuth(request);
            userID = user.id;
        } catch {
            userID = null;
        }

        if (userID && !uuidValidate(userID)) {
            return NextResponse.json(
                { error: 'Invalid user ID' },
                { status: 400 }
            );
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = parseInt(searchParams.get('offset') || '0');

        const [result] = await clientPool.query('CALL get_topic_comments(?, ?, ?, ?)', [
            id,
            userID,
            limit,
            offset,
        ]);

        const total = result[0][0]?.total || 0;
        const comments = result[1] || [];
        return NextResponse.json(
            {
                comments: comments.map(comment => ({
                    id: comment.id,
                    userID: comment.userID,
                    username: comment.username,
                    text: comment.body,
                    createdAt: comment.createdAt,
                    updatedAt: comment.updatedAt,
                    likes: comment.likes,
                    dislikes: comment.dislikes,
                    userReaction: comment.userReaction
                })),
                pagination: {
                    total,
                    limit,
                    skip: offset,
                    hasMore: offset + limit < total
                }
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error fetching comments:', error)
        return NextResponse.json(
            { error: 'Internal server error. Please try again.' },
            { status: 500 }
        );
    }
}
