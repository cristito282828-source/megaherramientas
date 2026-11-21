"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";
import { COLOMBIA_DEPARTMENTS } from "@/lib/woocommerce/colombia";
import COLOMBIA_MUNICIPALITIES from "@/lib/woocommerce/colombia-municipalities.json";

interface FormData {
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  codigoPostal: string;
  departamento: string;
}

export default function CheckoutPage() {
  const { cart, itemCount, clearCart, closeCart } = useCart();
  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
    ciudad: "",
    codigoPostal: "",
    departamento: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionType, setSubmissionType] = useState<
    "quote" | "order" | null
  >(null);
  const [quoteUrl, setQuoteUrl] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "departamento" ? { ciudad: "" } : {}),
    }));
  };

  const handleRequestQuote = async () => {
    if (!cart?.contents.nodes || itemCount === 0) return;

    // Validar campos requeridos
    if (
      !formData.nombre ||
      !formData.email ||
      !formData.telefono ||
      !formData.direccion ||
      !formData.ciudad ||
      !formData.departamento
    ) {
      alert("Por favor completa todos los campos obligatorios");
      return;
    }

    setIsSubmitting(true);
    setSubmissionType("quote");
    const whatsappWindow = window.open("about:blank", "_blank");
    if (whatsappWindow) whatsappWindow.opener = null;

    try {
      const response = await fetch("/api/whatsapp-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono,
          direccion: formData.direccion,
          ciudad: formData.ciudad,
          codigoPostal: formData.codigoPostal,
          departamento: formData.departamento,
          items: cart.contents.nodes.map((item) => ({
            nombre: item.productName,
            variacion: item.variationName || item.variationSize || "",
            quantity: item.quantity,
          })),
        }),
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(error.error || "Error al preparar la cotización");
      }

      const result: { whatsappUrl: string } = await response.json();
      setQuoteUrl(result.whatsappUrl);
      if (whatsappWindow) {
        whatsappWindow.location.href = result.whatsappUrl;
      }
    } catch (error: unknown) {
      whatsappWindow?.close();
      console.error("Error al preparar cotización por WhatsApp:", error);
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo preparar la cotización. Intenta nuevamente.";
      alert(message);
    } finally {
      setIsSubmitting(false);
      setSubmissionType(null);
    }
  };

  const handleCreateOrder = async () => {
    if (!cart?.contents.nodes || itemCount === 0) return;

    if (
      !formData.nombre ||
      !formData.email ||
      !formData.telefono ||
      !formData.direccion ||
      !formData.ciudad ||
      !formData.departamento
    ) {
      alert("Por favor completa todos los campos obligatorios");
      return;
    }

    setIsSubmitting(true);
    setSubmissionType("order");
    try {
      const response = await fetch("/api/woocommerce-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          items: cart.contents.nodes.map((item) => ({
            productId: item.productId,
            variationId: item.variationId || null,
            quantity: item.quantity,
          })),
        }),
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(error.error || "No se pudo crear el pedido");
      }

      const result: { orderNumber: string | number } = await response.json();
      closeCart();
      setOrderNumber(String(result.orderNumber));
      clearCart();
    } catch (error: unknown) {
      console.error("Error al crear el pedido en WooCommerce:", error);
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo crear el pedido. Intenta nuevamente.";
      alert(message);
    } finally {
      setIsSubmitting(false);
      setSubmissionType(null);
    }
  };

  if (orderNumber) {
    return (
      <main
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-success-title"
      >
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-700" />
          </div>
          <h1
            id="order-success-title"
            className="mb-4 font-belleza text-3xl font-light text-gray-900"
          >
            ¡Pedido creado con éxito!
          </h1>
          <p className="mb-2 text-gray-600">
            Tu número de pedido es{" "}
            <strong className="text-gray-900">#{orderNumber}</strong>.
          </p>
          <p className="mb-8 text-sm text-gray-500">
            El pedido quedó registrado en nuestra tienda. Aún no se ha realizado
            ningún cobro; te confirmaremos el costo de envío y las instrucciones
            de pago.
          </p>
          <div>
            <Link
              href="/"
              className="inline-flex items-center rounded-lg bg-green-700 px-8 py-3 font-medium text-white transition-colors hover:bg-green-800"
            >
              Volver a la tienda
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (quoteUrl) {
    return (
      <main className="min-h-screen bg-white pt-36">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                <CheckCircle className="h-10 w-10 text-green-700" />
              </div>
              <h1 className="font-belleza text-3xl font-light text-gray-900 mb-4">
                Cotización lista
              </h1>
              <p className="text-gray-600 mb-8">
                Tu carrito no se ha convertido en pedido. Envíanos la solicitud
                por WhatsApp para consultar disponibilidad y costo de envío.
              </p>
              <div className="space-y-4">
                <a
                  href={quoteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-700 text-white px-8 py-3 rounded-lg hover:bg-green-800 transition-colors font-medium"
                >
                  Abrir WhatsApp
                </a>
                <br />
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 border border-gray-300 text-gray-900 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Continuar Comprando
                </Link>
                <br />
                <Link
                  href="/"
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Volver al inicio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!cart || itemCount === 0) {
    return (
      <main className="min-h-screen bg-white pt-36">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center">
              <h1 className="font-belleza text-3xl font-light text-gray-900 mb-4">
                Tu carrito está vacío
              </h1>
              <p className="text-gray-600 mb-8">
                Agrega productos para finalizar tu compra
              </p>
              <Link
                href="/search"
                className="inline-flex items-center gap-2 bg-green-700 text-white px-8 py-3 rounded-lg hover:bg-green-800 transition-colors font-medium"
              >
                Explorar Productos
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-gray-50 pt-36">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/cart"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al carrito
            </Link>
            <h1 className="font-belleza text-3xl lg:text-4xl font-light tracking-wide text-gray-900">
              Finalizar Compra
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulario de checkout */}
            <div className="lg:col-span-2 space-y-6">
              {/* Información de contacto */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="font-moderat text-lg font-semibold text-gray-900 mb-4">
                  Información de Contacto
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent"
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent"
                      placeholder="tu@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent"
                      placeholder="+57 300 123 4567"
                    />
                  </div>
                </div>
              </div>

              {/* Dirección de envío */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="font-moderat text-lg font-semibold text-gray-900 mb-4">
                  Dirección de Envío
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección *
                    </label>
                    <input
                      type="text"
                      name="direccion"
                      value={formData.direccion}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent"
                      placeholder="Calle, número, barrio, apartamento/casa"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Departamento *
                    </label>
                    <select
                      name="departamento"
                      value={formData.departamento}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent"
                    >
                      <option value="">Selecciona un departamento</option>
                      {COLOMBIA_DEPARTMENTS.map((department) => (
                        <option key={department.code} value={department.code}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Municipio *
                      </label>
                      <select
                        name="ciudad"
                        value={formData.ciudad}
                        onChange={handleInputChange}
                        required
                        disabled={!formData.departamento}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent disabled:bg-gray-100"
                      >
                        <option value="">
                          {formData.departamento
                            ? "Selecciona un municipio"
                            : "Primero selecciona un departamento"}
                        </option>
                        {(
                          COLOMBIA_MUNICIPALITIES[
                            formData.departamento as keyof typeof COLOMBIA_MUNICIPALITIES
                          ] || []
                        ).map((municipality) => (
                          <option key={municipality} value={municipality}>
                            {municipality}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Código Postal
                      </label>
                      <input
                        type="text"
                        name="codigoPostal"
                        value={formData.codigoPostal}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent"
                        placeholder="Ej. 110111"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Resumen del pedido */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-32">
                <h2 className="font-moderat text-lg font-semibold text-gray-900 mb-4">
                  Resumen del Pedido
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Subtotal estimado de productos
                    </span>
                    <span className="font-medium text-gray-900">
                      {cart.subtotal}
                    </span>
                  </div>

                  {cart.discountTotal && cart.discountTotal !== "$0" && (
                    <div className="flex justify-between text-sm text-green-700">
                      <span>Descuento</span>
                      <span className="font-medium">-{cart.discountTotal}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200">
                    <span>Total estimado</span>
                    <span className="text-green-700">
                      {cart.total} + envío por confirmar
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Esta es una estimación del carrito. Confirmaremos
                    disponibilidad y envío al recibir la solicitud.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCreateOrder}
                  disabled={isSubmitting}
                  className={`mb-3 w-full rounded-lg px-6 py-3 font-moderat font-medium transition-colors ${
                    isSubmitting
                      ? "cursor-not-allowed bg-gray-300 text-gray-600"
                      : "bg-gray-900 text-white hover:bg-black"
                  }`}
                >
                  {submissionType === "order"
                    ? "Creando pedido..."
                    : "Crear pedido (pago pendiente)"}
                </button>
                <button
                  type="button"
                  onClick={handleRequestQuote}
                  disabled={isSubmitting}
                  className={`w-full py-3 px-6 rounded-lg font-moderat font-medium transition-colors ${
                    isSubmitting
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-green-700 text-white hover:bg-green-800"
                  }`}
                >
                  {submissionType === "quote"
                    ? "Preparando cotización..."
                    : "Cotizar por WhatsApp"}
                </button>

                <p className="text-xs text-gray-500 mt-4 text-center">
                  El pedido se registrará en WooCommerce como pendiente, sin
                  cobro. La cotización por WhatsApp es una opción independiente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
