import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log('Request body:', body);
        
        return NextResponse.json({ 
            message: 'Transferencia recibida correctamente' 
        });
    } catch (error) {
        console.error('Error en transferencia:', error);
        return NextResponse.json(
            { error: 'Error en la transferencia' },
            { status: 400 }
        );
    }
} 