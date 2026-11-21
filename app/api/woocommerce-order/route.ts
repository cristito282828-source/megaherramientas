import { NextRequest, NextResponse } from "next/server";
import { COLOMBIA_DEPARTMENTS } from "@/lib/woocommerce/colombia";
import colombiaMunicipalities from "@/lib/woocommerce/colombia-municipalities.json";

export const runtime = "nodejs";

interface OrderItemInput {
  productId: string;
  variationId?: string | null;
  quantity: number;
}

interface OrderPayload {
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  codigoPostal?: string;
  departamento: string;
  items: OrderItemInput[];
}

interface WooProduct {
  id: number;
  type: string;
  price: string;
  stock_status: string;
  stock_quantity: number | null;
  backorders_allowed: boolean;
  purchasable: boolean;
}

interface WooVariation {
  id: number;
  parent_id: number;
  price: string;
  stock_status: string;
  stock_quantity: number | null;
  backorders_allowed: boolean;
  purchasable: boolean;
}

interface WooOrder {
  id: number;
  number: string;
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

function isPositiveIntegerString(value: unknown): value is string {
  return typeof value === "string" && /^[1-9]\d{0,9}$/.test(value);
}

function isValidOrder(value: unknown): value is OrderPayload {
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

  const seenItems = new Set<string>();
  return body.items.every((item) => {
    if (!item || typeof item !== "object") return false;
    const orderItem = item as Record<string, unknown>;
    if (
      !isPositiveIntegerString(orderItem.productId) ||
      (orderItem.variationId !== undefined &&
        orderItem.variationId !== null &&
        !isPositiveIntegerString(orderItem.variationId)) ||
      !Number.isInteger(orderItem.quantity) ||
      Number(orderItem.quantity) < 1 ||
      Number(orderItem.quantity) > MAX_QUANTITY
    ) {
      return false;
    }

    const key = `${orderItem.productId}:${orderItem.variationId || ""}`;
    if (seenItems.has(key)) return false;
    seenItems.add(key);
    return true;
  });
}

function splitName(name: string) {
  const [firstName, ...lastName] = name.trim().split(/\s+/);
  return {
    first_name: firstName,
    last_name: lastName.join(" ") || firstName,
  };
}

function isAvailable(item: WooProduct | WooVariation, quantity: number) {
  return (
    item.purchasable &&
    item.stock_status !== "outofstock" &&
    (item.stock_quantity === null ||
      item.backorders_allowed ||
      item.stock_quantity >= quantity)
  );
}

function getLineTotal(price: string, quantity: number): string | null {
  if (!price.trim()) return null;
  const unitPrice = Number(price);
  if (!Number.isFinite(unitPrice) || unitPrice < 0) return null;
  return (unitPrice * quantity).toFixed(2);
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

  if (!isValidOrder(payload)) {
    return NextResponse.json(
      { error: "Revisa los datos del pedido e intenta nuevamente." },
      { status: 400 },
    );
  }

  const storeUrl = process.env.NEXT_PUBLIC_WOOCOMMERCE_URL?.replace(/\/+$/, "");
  const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

  if (!storeUrl || !consumerKey || !consumerSecret) {
    console.error("Falta configurar la conexión REST de WooCommerce");
    return NextResponse.json(
      { error: "La creación de pedidos no está disponible en este momento." },
      { status: 503 },
    );
  }

  let apiBaseUrl: string;
  try {
    const parsedUrl = new URL(storeUrl);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Unsupported WooCommerce URL protocol");
    }
    apiBaseUrl = `${storeUrl}/wp-json/wc/v3`;
  } catch {
    console.error("NEXT_PUBLIC_WOOCOMMERCE_URL no es una URL válida");
    return NextResponse.json(
      { error: "La conexión con la tienda no está configurada correctamente." },
      { status: 503 },
    );
  }

  const authorization = `Basic ${Buffer.from(
    `${consumerKey}:${consumerSecret}`,
  ).toString("base64")}`;

  const wooRequest = async <T>(path: string, init?: RequestInit) => {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
    const data = (await response.json().catch(() => null)) as T | null;
    if (!response.ok) {
      const error = new Error("WooCommerce request failed");
      Object.assign(error, { status: response.status });
      throw error;
    }
    return data;
  };

  try {
    const productCache = new Map<string, Promise<WooProduct | null>>();
    const variationCache = new Map<string, Promise<WooVariation | null>>();
    const lineItems = await Promise.all(
      payload.items.map(async (item) => {
        let productPromise = productCache.get(item.productId);
        if (!productPromise) {
          productPromise = wooRequest<WooProduct>(
            `/products/${item.productId}`,
          );
          productCache.set(item.productId, productPromise);
        }
        const product = await productPromise;
        if (!product || !isAvailable(product, item.quantity)) return null;

        const variationId = item.variationId || undefined;
        let price = product.price;
        if (variationId) {
          const variationKey = `${item.productId}:${variationId}`;
          let variationPromise = variationCache.get(variationKey);
          if (!variationPromise) {
            variationPromise = wooRequest<WooVariation>(
              `/products/${item.productId}/variations/${variationId}`,
            );
            variationCache.set(variationKey, variationPromise);
          }
          const variation = await variationPromise;
          if (
            !variation ||
            variation.parent_id !== Number(item.productId) ||
            !isAvailable(variation, item.quantity)
          ) {
            return null;
          }
          price = variation.price;
        } else if (product.type === "variable") {
          return null;
        }

        const total = getLineTotal(price, item.quantity);
        if (total === null) return null;

        return {
          product_id: Number(item.productId),
          ...(variationId ? { variation_id: Number(variationId) } : {}),
          quantity: item.quantity,
          subtotal: total,
          total,
        };
      }),
    );

    if (lineItems.some((item) => item === null)) {
      return NextResponse.json(
        {
          error:
            "Uno o más productos ya no están disponibles. Actualiza el carrito e intenta nuevamente.",
        },
        { status: 409 },
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

    const name = splitName(payload.nombre);
    const address = {
      ...name,
      address_1: payload.direccion.trim(),
      city: payload.ciudad.trim(),
      state: payload.departamento,
      postcode: payload.codigoPostal?.trim() || "",
      country: "CO",
      email: payload.email.trim(),
      phone: payload.telefono.trim(),
    };
    const order = await wooRequest<WooOrder>("/orders", {
      method: "POST",
      body: JSON.stringify({
        status: "pending",
        set_paid: false,
        customer_note: "Envío y pago pendientes de confirmación por la tienda.",
        billing: address,
        shipping: {
          ...address,
          email: undefined,
          phone: undefined,
        },
        line_items: lineItems,
      }),
    });

    if (!order?.id || !order.number) {
      console.error("WooCommerce respondió sin los datos del pedido");
      return NextResponse.json(
        { error: "No se pudo confirmar la creación del pedido." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.number,
    });
  } catch (error) {
    const status =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : undefined;
    console.error("Error al crear el pedido en WooCommerce", { status });
    return NextResponse.json(
      {
        error:
          status === 404
            ? "Uno o más productos ya no están disponibles. Actualiza el carrito e intenta nuevamente."
            : status === 401 || status === 403
              ? "La tienda rechazó las credenciales de pedidos. Contacta al soporte."
              : "No se pudo crear el pedido en WooCommerce. Intenta nuevamente.",
      },
      {
        status:
          status === 404 ? 409 : status === 401 || status === 403 ? 503 : 502,
      },
    );
  }
}
