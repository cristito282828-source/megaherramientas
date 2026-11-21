/** @jest-environment node */

import { NextRequest } from "next/server";
import { POST } from "./route";

const originalEnv = {
  storeUrl: process.env.NEXT_PUBLIC_WOOCOMMERCE_URL,
  consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY,
  consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET,
};

const validPayload = {
  nombre: "Ana Pérez",
  email: "ana@example.com",
  telefono: "+57 300 123 4567",
  direccion: "Calle 10 # 20-30",
  ciudad: "Medellín",
  codigoPostal: "050001",
  departamento: "ANT",
  items: [{ productId: "123", variationId: null, quantity: 2 }],
};

function createRequest(payload: unknown, origin = "http://localhost") {
  return new NextRequest("http://localhost/api/woocommerce-order", {
    method: "POST",
    headers: {
      origin,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/woocommerce-order", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_WOOCOMMERCE_URL = "https://shop.example";
    process.env.WOOCOMMERCE_CONSUMER_KEY = "test-key";
    process.env.WOOCOMMERCE_CONSUMER_SECRET = "test-secret";
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalEnv.storeUrl === undefined) {
      delete process.env.NEXT_PUBLIC_WOOCOMMERCE_URL;
    } else {
      process.env.NEXT_PUBLIC_WOOCOMMERCE_URL = originalEnv.storeUrl;
    }
    if (originalEnv.consumerKey === undefined) {
      delete process.env.WOOCOMMERCE_CONSUMER_KEY;
    } else {
      process.env.WOOCOMMERCE_CONSUMER_KEY = originalEnv.consumerKey;
    }
    if (originalEnv.consumerSecret === undefined) {
      delete process.env.WOOCOMMERCE_CONSUMER_SECRET;
    } else {
      process.env.WOOCOMMERCE_CONSUMER_SECRET = originalEnv.consumerSecret;
    }
  });

  it("creates an unpaid WooCommerce order using the current product price", async () => {
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(
        jsonResponse({
          id: 123,
          type: "simple",
          price: "12500",
          stock_status: "instock",
          stock_quantity: 10,
          backorders_allowed: false,
          purchasable: true,
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ id: 987, number: "10045" }, 201));

    const response = await POST(createRequest(validPayload));
    const result = await response.json();
    const orderRequest = fetchMock.mock.calls[1]?.[1];
    const orderBody = JSON.parse(String(orderRequest?.body));

    expect(response.status).toBe(200);
    expect(result).toEqual({ orderId: 987, orderNumber: "10045" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(orderRequest?.method).toBe("POST");
    expect(orderBody.status).toBe("pending");
    expect(orderBody.set_paid).toBe(false);
    expect(orderBody.line_items).toEqual([
      {
        product_id: 123,
        quantity: 2,
        subtotal: "25000.00",
        total: "25000.00",
      },
    ]);
    expect(orderBody.billing.country).toBe("CO");
    expect(orderBody.billing.state).toBe("ANT");
    expect(orderBody.shipping.city).toBe("Medellín");
  });

  it("uses the current variation price and verifies the parent product", async () => {
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(
        jsonResponse({
          id: 123,
          type: "variable",
          price: "",
          stock_status: "instock",
          stock_quantity: null,
          backorders_allowed: false,
          purchasable: true,
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          id: 456,
          parent_id: 123,
          price: "6000",
          stock_status: "instock",
          stock_quantity: 5,
          backorders_allowed: false,
          purchasable: true,
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ id: 988, number: "10046" }, 201));

    const response = await POST(
      createRequest({
        ...validPayload,
        items: [{ productId: "123", variationId: "456", quantity: 2 }],
      }),
    );
    const orderBody = JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body));

    expect(response.status).toBe(200);
    expect(orderBody.line_items).toEqual([
      {
        product_id: 123,
        variation_id: 456,
        quantity: 2,
        subtotal: "12000.00",
        total: "12000.00",
      },
    ]);
  });

  it("does not create an order when WooCommerce reports insufficient stock", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValueOnce(
      jsonResponse({
        id: 123,
        type: "simple",
        price: "12500",
        stock_status: "instock",
        stock_quantity: 1,
        backorders_allowed: false,
        purchasable: true,
      }),
    );

    const response = await POST(createRequest(validPayload));
    const result = await response.json();

    expect(response.status).toBe(409);
    expect(result.error).toContain("ya no están disponibles");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects a municipality that does not belong to the selected department", async () => {
    const fetchMock = jest.spyOn(global, "fetch");
    const response = await POST(
      createRequest({ ...validPayload, ciudad: "Cali" }),
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects cross-origin requests", async () => {
    const fetchMock = jest.spyOn(global, "fetch");
    const response = await POST(
      createRequest(validPayload, "https://attacker.example"),
    );

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
