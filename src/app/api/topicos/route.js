import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '5');
        const skip = parseInt(searchParams.get('skip') || '0');
        const filterValue = searchParams.get('filterValue') || '';

        const client = await clientPromise;
        const db = client.db('projeto-final');
        const topicsCollection = db.collection('topics');

        const filter = {};
        if (filterValue) {
            filter.titulo = { $regex: filterValue, $options: 'i' };
        }

        const sort = { createdAt: -1 };

        const [topics, total] = await Promise.all([topicsCollection
            .find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .toArray(),
            topicsCollection.countDocuments(filter)
        ]);

        return NextResponse.json(
            {
                topics: topics.map(topic => ({
                    id: topic._id,
                    titulo: topic.titulo,
                    conteudo: topic.conteudo
                        ? topic.conteudo.length > 100
                            ? topic.conteudo.substring(0, 100) + '...' 
                            : topic.conteudo    
                        : '',
                    autor: {
                        id: topic.autor?.id,
                        nome: topic.autor?.nome
                    },
                    commentCount: topic.commentCount || 0,
                    createdAt: topic.createdAt
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
        console.error('Erro ao buscar tópicos:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor. Tente novamente.' },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const { titulo, conteudo, userId, nome } = await request.json();

        if(!titulo){
            return NextResponse.json(
                { error: 'Título é obrigatório' },
                { status: 400 }
            );
        }

        if (!userId || !ObjectId.isValid(userId)) {
            return NextResponse.json(
                { error: 'ID de utilizador inválido' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('projeto-final');
        const topicsCollection = db.collection('topics');

        const newTopic = {
            titulo: titulo.trim(),
            conteudo: conteudo?.trim() || '',
            autor: {
                id: new ObjectId(userId),
                nome: nome
            },
            commentCount: 0,
            createdAt: new Date()
        };

        const result = await topicsCollection.insertOne(newTopic);

        return NextResponse.json(
            { 
                message: 'Tópico criado com sucesso!',
                topicId: result.insertedId
            },
            { status: 201 }
        );

    } catch (error) {
        console.error('Erro na criação de comentário:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor. Tente novamente.' },
            { status: 500 }
        );
    }
}
