import { NextResponse } from 'next/server';
import clientPool from '@/lib/db'
import { validate as uuidValidate } from 'uuid';

export async function GET(request, { params }) {
    try {
        const { id } = await params;

        if (!id || !uuidValidate(id)) {
            return NextResponse.json(
                { error: 'Invalid topic ID' },
                { status: 400 }
            );
        }

        const [rows] = await clientPool.query('SELECT * FROM get_topics WHERE id = ? LIMIT 1',
            [id]
        );

        const topic = rows[0];
        
        if (!topic) {
            return NextResponse.json(
                { error: 'Topic not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                topic: {
                    id: topic.id,
                    userID: topic.userID,
                    username: topic.username,
                    title: topic.title,
                    content: topic.content || '',
                    createdAt: topic.createdAt,
                    updatedAt: topic.updatedAt
                }
            }
        )
    } catch (error) {
        console.error('Error fetching topic:', error)
        return NextResponse.json(
            { error: 'Internal server error. Please try again.' },
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const { userID, role } = await request.json();

        if (!id || !uuidValidate(id)) {
            return NextResponse.json(
                { error: 'Invalid topic ID' },
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

        const [result] = await clientPool.query('CALL soft_delete_topic(?, ?, ?)', [
            id,
            userID,
            role
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
                { error: 'Lacks permission to remove topic' },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { 
                message: 'Topic removed successfully',
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error removing topic:', error);
        return NextResponse.json(
            { error: 'Internal server error. Please try again.' },
            { status: 500 }
        );
    }
}

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const { userID, role, title, content } = await request.json();

        if(!title || title.trim() == ''){
            return NextResponse.json(
                { error: 'Title is required' },
                { status: 400 }
            );
        }

        if (!id || !uuidValidate(id)) {
            return NextResponse.json(
                { error: 'Invalid topic ID' },
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

        const [result] = await clientPool.query('CALL update_topic(?, ?, ?, ?, ?)', [
            id,
            userID,
            role,
            title,
            content
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
                { error: 'Lacks permission to update topic' },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { 
                message: 'Topic updated successfully',
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error updating topic:', error);
        return NextResponse.json(
            { error: 'Internal server error. Please try again.' },
            { status: 500 }
        );
    }
}
