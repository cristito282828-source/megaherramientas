import { NextRequest, NextResponse } from "next/server";
import { COLOMBIA_DEPARTMENTS } from "@/lib/woocommerce/colombia";
import colombiaMunicipalities from "@/lib/woocommerce/colombia-municipalities.json";

export const runtime = "nodejs";

interface QuoteItem {
  nombre: string;
  variacion?: string;
  quantity: number;
}

interface QuotePayload {
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  codigoPostal?: string;
  departamento: string;
  items: QuoteItem[];
}

const MAX_ITEMS = 30;
const MAX_QUANTITY = 99;

function isNonEmptyString(value: unknown, maxLength: number): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= maxLength
  );
}

function isValidQuote(value: unknown): value is QuotePayload {
  if (!value || typeof value !== "object") return false;
  const body = value as Record<string, unknown>;

  if (
    !isNonEmptyString(body.nombre, 100) ||
    !isNonEmptyString(body.email, 254) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()) ||
    !isNonEmptyString(body.telefono, 30) ||
    !/^[+\d\s().-]{7,30}$/.test(body.telefono.trim()) ||
    !isNonEmptyString(body.direccion, 150) ||
    !isNonEmptyString(body.ciudad, 100) ||
    (body.codigoPostal !== undefined &&
      (typeof body.codigoPostal !== "string" ||
        body.codigoPostal.length > 20)) ||
    !COLOMBIA_DEPARTMENTS.some(
      (department) => department.code === body.departamento,
    ) ||
    !colombiaMunicipalities[
      body.departamento as keyof typeof colombiaMunicipalities
    ]?.includes(body.ciudad as string) ||
    !Array.isArray(body.items) ||
    body.items.length === 0 ||
    body.items.length > MAX_ITEMS
  ) {
    return false;
  }

  return body.items.every((item) => {
    if (!item || typeof item !== "object") return false;
    const quoteItem = item as Record<string, unknown>;
    return (
      isNonEmptyString(quoteItem.nombre, 200) &&
      (quoteItem.variacion === undefined ||
        quoteItem.variacion === "" ||
        isNonEmptyString(quoteItem.variacion, 100)) &&
      Number.isInteger(quoteItem.quantity) &&
      Number(quoteItem.quantity) >= 1 &&
      Number(quoteItem.quantity) <= MAX_QUANTITY
    );
  });
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 16_384) {
    return NextResponse.json(
      { error: "La solicitud supera el tamaño permitido" },
      { status: 413 },
    );
  }

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).origin !== request.nextUrl.origin) {
        return NextResponse.json(
          { error: "Solicitud no válida" },
          { status: 403 },
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Solicitud no válida" },
        { status: 403 },
      );
    }
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "El formato de la solicitud no es válido" },
      { status: 400 },
    );
  }

  if (!isValidQuote(payload)) {
    return NextResponse.json(
      {
        error: "Revisa los datos de contacto y la dirección de la cotización.",
      },
      { status: 400 },
    );
  }

  const phoneNumber = process.env.PHONE_NUMBER?.replace(/\D/g, "");
  if (!phoneNumber || phoneNumber.length < 8 || phoneNumber.length > 15) {
    console.error("PHONE_NUMBER no está configurado correctamente");
    return NextResponse.json(
      {
        error: "La cotización por WhatsApp no está disponible en este momento.",
      },
      { status: 503 },
    );
  }

  const department = COLOMBIA_DEPARTMENTS.find(
    (entry) => entry.code === payload.departamento,
  );
  if (!department) {
    return NextResponse.json(
      { error: "Selecciona un departamento válido." },
      { status: 400 },
    );
  }

  const productLines = payload.items
    .map((item) => {
      const variation = item.variacion ? ` (${item.variacion.trim()})` : "";
      const name = item.nombre.replace(/<[^>]*>/g, "").trim();
      return `${item.quantity} x ${name}${variation}`;
    })
    .join("\n");
  const destination =
    payload.departamento === "DC"
      ? payload.ciudad
      : `${payload.ciudad}, ${department.name}`;
  const message = [
    "*SOLICITUD DE COTIZACIÓN - MegaHerramientas*",
    "",
    "*PRODUCTOS*",
    productLines,
    "",
    "*DATOS DE CONTACTO*",
    `Nombre: ${payload.nombre.trim()}`,
    `Email: ${payload.email.trim()}`,
    `Teléfono: ${payload.telefono.trim()}`,
    "",
    "*DIRECCIÓN DE ENVÍO*",
    payload.direccion.trim(),
    destination,
    ...(payload.codigoPostal?.trim()
      ? [`Código postal: ${payload.codigoPostal.trim()}`]
      : []),
    "",
    "Por favor confirmar disponibilidad y costo de envío. Esta solicitud no es un pedido ni un pago.",
  ].join("\n");

  return NextResponse.json({
    whatsappUrl: `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`,
  });
}
