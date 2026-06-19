import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const { productName, currentStock, minStock, userEmail } = await request.json();

  const { error } = await resend.emails.send({
    from: 'NotiStock <alertas@tudominio.com>',
    to: userEmail,
    subject: `⚠️ Stock crítico: ${productName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 2rem;">
        <h2 style="color: #a8e063;">⚠️ Alerta de stock crítico</h2>
        <p>El producto <strong>${productName}</strong> ha alcanzado nivel crítico de inventario.</p>
        <div style="background: #1a1f16; border: 1px solid #2a3024; border-radius: 8px; padding: 1rem; margin: 1.5rem 0;">
          <p style="color: #7a8a6a; margin: 0;">Stock actual</p>
          <p style="font-size: 2rem; font-weight: 700; color: #ff6b4a; margin: 0.3rem 0;">${currentStock} unidades</p>
          <p style="color: #7a8a6a; margin: 0;">Mínimo recomendado: ${minStock} unidades</p>
        </div>
        <p>Entra a tu inventario y realiza un pedido a tu proveedor lo antes posible.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
           style="display:inline-block; background:#a8e063; color:#0c0f0a; padding:0.8rem 1.5rem; border-radius:8px; text-decoration:none; font-weight:600; margin-top:1rem;">
          Ver inventario →
        </a>
        <p style="color: #7a8a6a; font-size: 0.8rem; margin-top: 2rem;">NotiStock · Inventario inteligente para negocios reales</p>
      </div>
    `,
  });

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
