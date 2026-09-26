import { NextRequest, NextResponse } from 'next/server';

interface OrderItem {
  productName: string;
  quantity: number;
  priceDisplay: string;
  variationSize?: string;
}

interface OrderPayload {
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  region: string;
  metodoPago: string;
  items: OrderItem[];
  total: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as OrderPayload;

    // Validación básica server-side
    if (!body.nombre || !body.email || !body.telefono) {
      return NextResponse.json(
        { error: 'Faltan datos del cliente' },
        { status: 400 }
      );
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'El pedido no tiene productos' },
        { status: 400 }
      );
    }

    // Número de WhatsApp leído SOLO en el servidor (privado)
    const phoneNumber = process.env.PHONE_NUMBER;
    if (!phoneNumber) {
      console.error('PHONE_NUMBER no está definida en el servidor');
      return NextResponse.json(
        { error: 'Configuración de WhatsApp no disponible' },
        { status: 500 }
      );
    }

    // Construir mensaje
    let message = '*NUEVO PEDIDO - MegaHerramientas*%0A%0A';
    message += '*DATOS DEL CLIENTE*%0A';
    message += `Nombre: ${body.nombre}%0A`;
    message += `Email: ${body.email}%0A`;
    message += `Telefono: ${body.telefono}%0A%0A`;

    message += '*DIRECCION DE ENVIO*%0A';
    message += `${body.direccion}, ${body.ciudad}%0A`;
    message += `Region: ${body.region}%0A%0A`;

    message += '*PRODUCTOS*%0A';
    body.items.forEach((item) => {
      const sizeInfo = item.variationSize ? ` (${item.variationSize} ml)` : '';
      message += `${item.quantity}x ${item.productName}${sizeInfo} - ${item.priceDisplay}%0A`;
    });

    message += `%0A*TOTAL: ${body.total}*%0A`;
    message += `Pago: ${body.metodoPago === 'transferencia' ? 'Transferencia' : 'Webpay'}%0A%0A`;
    message += 'Por favor confirmar mi pedido. Gracias!';

    const url = `https://wa.me/${phoneNumber}?text=${message}`;

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error en /api/whatsapp-order:', error);
    return NextResponse.json(
      { error: 'Error al procesar el pedido' },
      { status: 500 }
    );
  }
}
