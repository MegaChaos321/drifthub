import { NextResponse } from 'next/server';
import clientPool from '@/lib/db'
import { validate as uuidValidate } from 'uuid';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '5');
        const offset = parseInt(searchParams.get('skip') || '0');
        const search = searchParams.get('filterValue') || '';
        const sort = "DESC";

        const [result] = await clientPool.query('CALL get_topics_paginated(?, ?, ?, ?)', [
            search,
            limit,
            offset,
            sort
        ]);

        const total = result[0][0]?.total || 0;
        const topics = result[1] || [];
        return NextResponse.json(
            {
                topics: topics.map(topic => ({
                    id: topic.id,
                    userID: topic.userID,
                    username: topic.username,
                    title: topic.title,
                    content: topic.content?.length > 100 
                        ? `${topic.content.substring(0, 100)}...` 
                        : (topic.content || ''),
                    commentCount: topic.commentCount || 0,
                    createdAt: topic.createdAt,
                    updatedAt: topic.updatedAt
                })),
                pagination: {
                    total,
                    limit,
                    offset,
                    hasMore: offset + limit < total
                }
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error fetching topics:', error)
        return NextResponse.json(
            { error: 'Internal server error. Please try again.' },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const { title, content, userID } = await request.json();

        if(!title || title.trim() == ''){
            return NextResponse.json(
                { error: 'Title is required' },
                { status: 400 }
            );
        }

        if (!userID || !uuidValidate(userID)) {
            return NextResponse.json(
                { error: 'Invalid user ID' },
                { status: 400 }
            );
        }

        const [result] = await clientPool.query('CALL create_topic(?, ?, ?)', [
            userID,
            title,
            content
        ]);

        const newTopic = result[0][0];
        return NextResponse.json(
            { 
                message: 'Topic created successfully!',
                topicID: newTopic.id
            },
            { status: 201 }
        );

    } catch (error) {
        console.error('Error creating topic:', error);
        return NextResponse.json(
            { error: 'Internal server error. Please try again.' },
            { status: 500 }
        );
    }
}
