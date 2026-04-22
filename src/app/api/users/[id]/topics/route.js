import { NextResponse } from 'next/server';
import clientPool from '@/lib/db'
import { verifyAuth } from '@/lib/auth';
import { validate as uuidValidate } from 'uuid';

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
                { status: 400 }
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

        const { searchParams } = new URL(request.url);
        const viewMode = parseInt(searchParams.get('view') || '0');

        const [result] = await clientPool.query('CALL get_user_activity(?, ?, ?, ?)', [
            id,
            userID,
            userRole,
            viewMode
        ])

        const topics = result[0][0] || [];
        return NextResponse.json(
            {
                topics: topics.map(topic => ({
                    id: topic.id,
                    userID: topic.userID,
                    username: topic.username,
                    title: topic.title,
                    content: topic.content || '',
                    commentCount: topic.commentCount || 0,
                    createdAt: topic.createdAt,
                    updatedAt: topic.updatedAt,
                    deletedAt: topic.deletedAt || null
                }))
            }
        )
    } catch (error) {
        if (error.sqlState === '45000') {
            return NextResponse.json(
                { error: 'Access to deleted topics denied!' },
                { status: 403 }
            );
        }

        console.error('Error fetching profile topics:', error)
        return NextResponse.json(
            { error: 'Internal server error. Please try again.' },
            { status: 500 }
        );
    }
}