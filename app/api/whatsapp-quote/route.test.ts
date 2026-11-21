/** @jest-environment node */

import { NextRequest } from "next/server";
import { POST } from "./route";

const originalPhoneNumber = process.env.PHONE_NUMBER;

const validPayload = {
  nombre: "Ana Pérez",
  email: "ana@example.com",
  telefono: "+57 300 123 4567",
  direccion: "Calle 10 # 20-30",
  ciudad: "Medellín",
  codigoPostal: "050001",
  departamento: "ANT",
  items: [{ nombre: "Producto de prueba", variacion: "Talla M", quantity: 2 }],
};

function createRequest(payload: unknown, origin = "http://localhost") {
  return new NextRequest("http://localhost/api/whatsapp-quote", {
    method: "POST",
    headers: {
      origin,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

describe("POST /api/whatsapp-quote", () => {
  beforeEach(() => {
    process.env.PHONE_NUMBER = "573001234567";
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env.PHONE_NUMBER = originalPhoneNumber;
  });

  it("returns an encoded WhatsApp quote without calling WooCommerce", async () => {
    const fetchMock = jest.spyOn(global, "fetch");

    const response = await POST(createRequest(validPayload));
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.whatsappUrl).toContain("wa.me/573001234567");
    const message = new URL(result.whatsappUrl).searchParams.get("text");
    expect(message).toContain("SOLICITUD DE COTIZACIÓN");
    expect(message).toContain("2 x Producto de prueba (Talla M)");
    expect(message).toContain("Medellín, Antioquia");
    expect(message).toContain("no es un pedido ni un pago");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a municipality that does not belong to the selected department", async () => {
    const response = await POST(
      createRequest({ ...validPayload, ciudad: "Cali" }),
    );

    expect(response.status).toBe(400);
  });

  it("rejects cross-origin requests", async () => {
    const response = await POST(
      createRequest(validPayload, "https://attacker.example"),
    );

    expect(response.status).toBe(403);
  });
});
