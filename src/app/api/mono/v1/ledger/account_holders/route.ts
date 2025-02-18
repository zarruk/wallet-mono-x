import { NextResponse } from 'next/server';

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    console.log('Request Body:', body);

    // Cambiar a MONO_API_TOKEN_CARDS
    const MONO_API_TOKEN_CARDS = process.env.MONO_API_TOKEN_CARDS || '';

    // Verificar que el token no esté vacío
    if (!MONO_API_TOKEN_CARDS) {
      console.error('El token de Mono no está configurado.');
      return NextResponse.json(
        { error: 'Error en el servidor. Token no configurado.' },
        { status: 500 }
      );
    }

    // Configurar los encabezados para la solicitud a Mono
    const monoHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MONO_API_TOKEN_CARDS}`,
      'x-idempotency-key': request.headers.get('x-idempotency-key') || '',
    };

    // Hacer la solicitud a Mono
    const monoResponse = await fetch('https://api.sandbox.cuentamono.com/v1/ledger/account_holders', {
      method: 'POST',
      headers: monoHeaders,
      body: JSON.stringify(body),
    });

    const responseData = await monoResponse.json();

    // Registrar la respuesta de Mono
    console.log('Respuesta de Mono:', responseData);

    return NextResponse.json(responseData, { status: monoResponse.status });
  } catch (error: any) {
    console.error('Error en API route:', error);
    return NextResponse.json(
      { error: error.message || 'Error en el servidor' },
      { status: 500 }
    );
  }
}; 