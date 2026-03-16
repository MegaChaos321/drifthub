import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request) {
    try {
        const { topicId, texto, userId, nome } = await request.json();

        if(!texto){
            return NextResponse.json(
                { error: 'Texto é obrigatório' },
                { status: 400 }
            );
        }

        if (!userId || !ObjectId.isValid(userId)) {
            return NextResponse.json(
                { error: 'ID de utilizador inválido' },
                { status: 400 }
            );
        }

        if (!topicId || !ObjectId.isValid(topicId)) {
            return NextResponse.json(
                { error: 'ID de tópico inválido' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('projeto-final');
        const topicsCollection = db.collection('topics')
        const commentsCollection = db.collection('comments');

        const newComment = {
            topicId: new ObjectId(topicId),
            texto: texto.trim(),
            autor: {
                id: new ObjectId(userId),
                nome: nome
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const [result] = await Promise.all([
            commentsCollection.insertOne(newComment),
            topicsCollection.updateOne(
                { _id: new ObjectId(topicId) },
                { $inc: { commentCount: 1 } }
            )
        ]);

        return NextResponse.json(
            { 
                message: 'Comentário criado com sucesso!',
                commentId: result.insertedId
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
