import { NextResponse } from 'next/server';
import clientPool from '@/lib/db'

export async function GET(request) {
    try {
        const [row] = await clientPool.query('SELECT name FROM tags ORDER BY name ASC');

        return NextResponse.json(
            {
                tags: row.map(tag => ({
                    label: tag.name,
                    value: tag.name
                })),
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error fetching tags:', error)
        return NextResponse.json(
            { error: 'Internal server error. Please try again.' },
            { status: 500 }
        );
    }
}
