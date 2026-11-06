import { describe, expect, it } from "vitest";
import { autorizar, confirmar, cotizar, validar } from "../lib/checkout";
import { catalogo } from "../lib/datos/catalogos";
import { destinosDisponibles } from "../lib/datos/destinos";
import { firmar } from "../lib/tokens";
import { detalleViaje } from "../lib/viaje";
import type { Busqueda, Reserva, Seleccion } from "../lib/dominio";
import { calcularPrecios, errorBusqueda, isoDia, sumarDias } from "../lib/precios";
import { transicionar } from "../lib/reserva";

const ida = sumarDias(isoDia(Date.now()), 30);
const busqueda: Busqueda = { ida, vuelta: sumarDias(ida, 7), origen: "EZE", pasajeros: 2 };
const seleccion: Seleccion = { vuelo: "EZE-1", hotel: "arena", asistencia: "completa" };
const clave = "96ad28b4-e12c-4675-8da9-97ceae23681a";

function ofertaValidada() {
  const resultado = validar(cotizar(busqueda, seleccion).token, "normal");
  if (resultado.tipo !== "lista") throw new Error("La prueba requiere una tarifa estable.");
  return resultado.oferta;
}

describe("cotización", () => {
  it("calcula en centavos por viajero, noche y día", () => {
    const ofertas = catalogo(busqueda);
    const p = calcularPrecios(busqueda, ofertas, seleccion);
    expect(p).toEqual({
      vuelo: ofertas.vuelos[0].precio * 2, hotel: 8900 * 7 * 2,
      asistencia: 760 * 8 * 2, total: ofertas.vuelos[0].precio * 2 + 8900 * 7 * 2 + 760 * 8 * 2,
    });
    expect(errorBusqueda({ ...busqueda, vuelta: sumarDias(ida, 4) })).toMatch(/5 a 14/);
  });
  it("detecta el cambio y firma las dos alternativas", () => {
    const inicial = cotizar(busqueda, seleccion);
    const resultado = validar(inicial.token, "tarifa");
    expect(resultado.tipo).toBe("cambio");
    if (resultado.tipo !== "cambio") return;
    expect(resultado.oferta.cotizacion.precios.total - resultado.anterior).toBe(7000);
    expect(resultado.alternativa.cotizacion.seleccion.vuelo).not.toBe(seleccion.vuelo);
    expect(autorizar(resultado.alternativa.token, clave, "normal", false).aprobado).toBe(true);
  });
  it("rechaza firmas modificadas y cotizaciones vencidas", () => {
    const inicial = cotizar(busqueda, seleccion);
    expect(() => validar(inicial.token + "x", "normal")).toThrow(/firma/);
    expect(() => validar(inicial.token, "normal", inicial.cotizacion.vence)).toThrow(/venció/);
  });
});

describe("reserva", () => {
  it("conserva cada transición y evita saltos", () => {
    const oferta = ofertaValidada();
    const reserva: Reserva = { id: oferta.cotizacion.id, estado: "cotizada", historial: [], oferta, cotizacionMs: 1200 };
    const fecha = new Date().toISOString();
    expect(() => transicionar(reserva, "emitida", "Inválida", fecha)).toThrow();
    const validada = transicionar(reserva, "validada", "Validada", fecha);
    expect(validada.historial).toEqual([{ estado: "validada", fecha, detalle: "Validada" }]);
    expect(reserva.historial).toHaveLength(0);
  });
  it("autoriza y captura de forma idempotente", () => {
    const oferta = ofertaValidada();
    const primero = autorizar(oferta.token, clave, "normal", false);
    const repetido = autorizar(oferta.token, clave, "normal", false);
    expect(primero).toEqual(repetido);
    if (!primero.aprobado) throw new Error("No se autorizó.");
    const captura = confirmar(primero.recibo, oferta.cotizacion.id);
    expect(captura.emitida).toBe(true);
    expect(captura).toEqual(confirmar(primero.recibo, oferta.cotizacion.id));
  });
  it("rechaza autorización y compensa confirmaciones parciales", () => {
    const oferta = ofertaValidada();
    expect(autorizar(oferta.token, clave, "rechazado", false).aprobado).toBe(false);
    const parcial = autorizar(oferta.token, clave, "parcial", false);
    if (!parcial.aprobado) throw new Error("No se autorizó.");
    const resultado = confirmar(parcial.recibo, oferta.cotizacion.id);
    expect(resultado).toMatchObject({ emitida: false, etapa: "Confirmación", proveedor: "Asistencia al viajero" });
    if (!resultado.emitida) expect(resultado.liberados).toHaveLength(3);
  });
  it("libera todo ante falla de captura y emite en un nuevo intento", () => {
    const oferta = ofertaValidada();
    const primero = autorizar(oferta.token, clave, "recuperacion", false);
    const segundo = autorizar(oferta.token, "ac3df238-773f-474b-a6a4-1767d60352b7", "recuperacion", true);
    if (!primero.aprobado || !segundo.aprobado) throw new Error("No se autorizó.");
    expect(primero.autorizacion).not.toBe(segundo.autorizacion);
    const fallo = confirmar(primero.recibo, oferta.cotizacion.id);
    expect(fallo).toMatchObject({ emitida: false, etapa: "Captura" });
    if (!fallo.emitida) expect(fallo.liberados).toHaveLength(4);
    expect(confirmar(segundo.recibo, oferta.cotizacion.id).emitida).toBe(true);
  });
});

describe("catálogo por destino", () => {
  it.each(destinosDisponibles)("cotiza y conserva %s hasta la emisión", destino => {
    const consulta = { ...busqueda, destino };
    const { vuelos, hoteles } = catalogo(consulta);
    expect(vuelos).toHaveLength(3);
    expect(hoteles).toHaveLength(3);
    const servicio = { vuelo: vuelos[0].id, hotel: hoteles[0].id, asistencia: "completa" };
    const oferta = cotizar(consulta, servicio);
    const validacion = validar(oferta.token, "normal");
    if (validacion.tipo !== "lista") throw new Error("Se esperaba una tarifa estable.");
    const pago = autorizar(validacion.oferta.token, clave, "normal", false);
    if (!pago.aprobado) throw new Error("No se autorizó el pago.");
    expect(confirmar(pago.recibo, oferta.cotizacion.id).emitida).toBe(true);
    expect(detalleViaje({
      id: oferta.cotizacion.id, oferta: validacion.oferta, estado: "emitida", historial: [], cotizacionMs: 0,
    }).codigo).toBe(destino);
  });

  it("bloquea servicios de otro destino y cambios de destino en una cotización firmada", () => {
    const cancun: Busqueda = { ...busqueda, destino: "CUN" };
    expect(errorBusqueda({ ...busqueda, destino: "XXX" })).toMatch(/destino disponible/);
    expect(() => cotizar(cancun, seleccion)).toThrow(/servicio/);
    expect(() => cotizar(cancun, seleccion, cotizar(busqueda, seleccion).token)).toThrow(/otra búsqueda/);
  });

  it("mantiene las reservas y cotizaciones anteriores como Punta Cana", () => {
    const { cotizacion } = cotizar(busqueda, seleccion);
    const anterior = { ...cotizacion, busqueda };
    const resultado = validar(firmar("cotizacion", anterior), "normal");
    expect(resultado.tipo).toBe("lista");
    expect(detalleViaje({
      id: cotizacion.id, oferta: resultado.oferta, estado: "emitida", historial: [], cotizacionMs: 0,
    }).destino.nombre).toBe("Punta Cana");
  });
});
