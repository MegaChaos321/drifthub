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

        const client = await clientPromise
        const db = client.db('projeto-final');
        const topicsCollection = db.collection('topics');

        const topic = await topicsCollection.findOne({ _id: new ObjectId(id) });
        
        if (!topic) {
            return NextResponse.json(
                { error: 'Tópico não encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                topic: {
                    id: topic._id,
                    titulo: topic.titulo,
                    conteudo: topic.conteudo || '',
                    autor: {
                        id: topic.autor.id,
                        nome: topic.autor.nome
                    },
                    createdAt: topic.createdAt
                }
            }
        )
    } catch (error) {
        console.error('Erro ao buscar tópico:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor. Tente novamente.' },
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const { userId } = await request.json();

        if (!id || !ObjectId.isValid(id)) {
            return NextResponse.json(
                { error: 'ID de tópico inválido' },
                { status: 400 }
            );
        }

        if (!userId || !ObjectId.isValid(userId)) {
            return NextResponse.json(
                { error: 'ID de utilizador inválido' },
                { status: 400 }
            );
        }

        const client = await clientPromise
        const db = client.db('projeto-final');
        const topicsCollection = db.collection('topics');
        const commentsCollection = db.collection('comments');

        const topicId = new ObjectId(id);

        const topic = await topicsCollection.findOne({ _id: topicId });
        
        if (!topic) {
            return NextResponse.json(
                { error: 'Tópico não encontrado' },
                { status: 404 }
            );
        }

        if(String(topic.autor.id) !== String(userId)){
            return NextResponse.json(
                { error: 'Sem permissão para eliminar tópico' },
                { status: 403 }
            );
        }

        const [delComments, delTopic] = await Promise.all([
            commentsCollection.deleteMany({ topicId: topicId }),
            topicsCollection.deleteOne({ _id: topicId })
        ]);

        if (delTopic.deletedCount === 0) {
            return NextResponse.json(
                { error: 'Erro ao eliminar tópico' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { 
                message: 'Tópico e comentários eliminados com sucesso',
                details: {
                    commentsDeleted: delComments.deletedCount
                }
            },
            { status: 200 }
        );

    } catch (error) {
        console.error('Erro ao eliminar tópico:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor. Tente novamente.' },
            { status: 500 }
        );
    }
}
