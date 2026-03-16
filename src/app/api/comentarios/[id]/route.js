import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const { topicId, userId } = await request.json();

        if (!id || !ObjectId.isValid(id)) {
            return NextResponse.json(
                { error: 'ID de comentário inválido' },
                { status: 400 }
            );
        }

        if (!topicId || !ObjectId.isValid(topicId)) {
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

        const comment = await commentsCollection.findOne({ _id: new ObjectId(id) });
        
        if (!comment) {
            return NextResponse.json(
                { error: 'Comentário não encontrado' },
                { status: 404 }
            );
        }

        if(String(comment.autor.id) !== String(userId)){
            return NextResponse.json(
                { error: 'Sem permissão para eliminar comentário' },
                { status: 403 }
            );
        }

        const [result] = await Promise.all([
            commentsCollection.deleteOne({ _id: new ObjectId(id) }),
            topicsCollection.updateOne(
                { _id: new ObjectId(topicId) },
                { $inc: { commentCount: -1 } }
            )
        ]);

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { error: 'Erro ao eliminar comentário' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { message: 'Comentário eliminado com sucesso' },
            { status: 200 }
        );

    } catch (error) {
        console.error('Erro ao eliminar comentário:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor. Tente novamente.' },
            { status: 500 }
        );
    }
}

export async function PUT(request, { params }) {
  try {
        const { id } = await params;
        const { userId, texto } = await request.json();

        if (!id || !ObjectId.isValid(id)) {
            return NextResponse.json(
                { error: 'ID de comentário inválido' },
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
        const commentsCollection = db.collection('comments');

        const comment = await commentsCollection.findOne({ _id: new ObjectId(id) });
        
        if (!comment) {
            return NextResponse.json(
                { error: 'Comentário não encontrado' },
                { status: 404 }
            );
        }

        if(String(comment.autor.id) !== String(userId)){
            return NextResponse.json(
                { error: 'Sem permissão para atualizar comentário' },
                { status: 403 }
            );
        }

        const updateData = {
            updatedAt: new Date()
        };

        if (texto !== undefined && texto.trim().length !== 0) {
            updateData.texto = texto.trim();
        } else {
            return NextResponse.json(
                { error: 'Comentário não pode estar vazio' },
                { status: 400 }
            );
        }

        const result = await commentsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { error: 'Comentário não encontrado' },
                { status: 404 }
            );
        }

        const updatedComment = await commentsCollection.findOne(
            { _id: new ObjectId(id) }
        );

        const mappedComment = {
            id: updatedComment._id.toString(),
            texto: updatedComment.texto,
            autor: {
                id: updatedComment.autor?.id,
                nome: updatedComment.autor?.nome
            },
            createdAt: updatedComment.createdAt,
            updatedAt: updatedComment.updatedAt
        };

        return NextResponse.json(
            { 
                message: 'Comentário atualizado com sucesso',
                comment: mappedComment
            },
            { status: 200 }
        );

  } catch (error) {
        console.error('Erro ao atualizar comentário:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor. Tente novamente.' },
            { status: 500 }
        );
  }
}
