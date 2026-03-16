import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request, { params }) {
    try {
        const { id } = await params;

        if (!id || !ObjectId.isValid(id)) {
            return NextResponse.json(
                { error: 'ID de tópico inválido' },
                { status: 400 }
            );
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = parseInt(searchParams.get('skip') || '0');

        const client = await clientPromise;
        const db = client.db('projeto-final');
        const commentsCollection = db.collection('comments');

        const query = { topicId: new ObjectId(id) }
        const sort = { createdAt: 1 };

        const [comments, total] = await Promise.all([commentsCollection
            .find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .toArray(),
            commentsCollection.countDocuments(query)
        ]);

        return NextResponse.json(
            {
                comments: comments.map(comment => ({
                    id: comment._id,
                    texto: comment.texto,
                    autor: {
                        id: comment.autor?.id,
                        nome: comment.autor?.nome
                    },
                    createdAt: comment.createdAt,
                    updatedAt: comment.updatedAt
                })),
                pagination: {
                    total,
                    limit,
                    skip,
                    hasMore: skip + limit < total
                }
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Erro ao buscar comentários:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor. Tente novamente.' },
            { status: 500 }
        );
    }
}
