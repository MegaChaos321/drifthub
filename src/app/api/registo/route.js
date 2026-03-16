import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { email, password, nome } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e password são obrigatórios' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A password deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('projeto-final');
    const usersCollection = db.collection('users');

    const existingUser = await usersCollection.findOne({ 
      email: email.trim().toLowerCase() 
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está registado' },
        { status: 409 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      nome: nome || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await usersCollection.insertOne(newUser);

    return NextResponse.json(
      { 
        message: 'Utilizador registado com sucesso!',
        userId: result.insertedId 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Erro no registo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor. Tente novamente.' },
      { status: 500 }
    );
  }
}
