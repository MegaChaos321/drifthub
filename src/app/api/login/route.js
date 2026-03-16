import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e password são obrigatórios' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('projeto-final');
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ 
      email: email.trim().toLowerCase()
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Email ou password incorretos' },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Email ou password incorretos' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Login efetuado com sucesso!',
        user: {
          id: user._id,
          email: user.email,
          nome: user.nome
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor. Tente novamente.' },
      { status: 500 }
    );
  }
}
