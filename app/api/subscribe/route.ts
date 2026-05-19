import { NextResponse } from 'next/server';
console.log('API KEY:', process.env.BREVO_API_KEY);

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
  }

  const res = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY!,
    },
    body: JSON.stringify({
      email,
      listIds: [Number(process.env.BREVO_LIST_ID)],
      updateEnabled: true,
    }),
  });

  const data = await res.json();
  console.log('Brevo status:', res.status);
  console.log('Brevo response:', data);

  if (!res.ok && res.status !== 204) {
    return NextResponse.json({ error: 'Error al guardar', detail: data }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}