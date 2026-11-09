import { describe, expect, it } from "vitest";
import { autorizar, cotizar, validar } from "../lib/checkout";
import { destinoSeguro, usuarioActual, viajeros } from "../lib/cuenta";
import { generarDemo } from "../lib/demo";
import type { Busqueda, Caso, Reserva, Seleccion } from "../lib/dominio";
import { crearPdf } from "../lib/pdf";
import { cambiarEstado, estadoCaso, intervenir } from "../lib/postventa";
import { isoDia, sumarDias } from "../lib/precios";
import { camposDocumento, estadoServicios } from "../lib/viaje";

const ida = sumarDias(isoDia(Date.now()), 30);
const busqueda: Busqueda = { ida, vuelta: sumarDias(ida, 7), origen: "EZE", pasajeros: 2 };
const seleccion: Seleccion = { vuelo: "EZE-1", hotel: "arena", asistencia: "completa" };

function reservaBase(cambios: Partial<Reserva> = {}): Reserva {
  const oferta = cotizar(busqueda, seleccion);
  return { id: oferta.cotizacion.id, oferta, estado: "validada", historial: [], cotizacionMs: 0, ...cambios };
}

describe("estado por servicio", () => {
  it("confirma los tres servicios cuando hay referencias", () => {
    const servicios = estadoServicios(reservaBase({ estado: "emitida", referencias: { vuelo: "VUE-1", hotel: "HOT-1", asistencia: "ASI-1" } }));
    expect(servicios.map(item => item.estado)).toEqual(["Confirmado", "Confirmado", "Confirmado"]);
    expect(servicios.map(item => item.referencia)).toEqual(["VUE-1", "HOT-1", "ASI-1"]);
  });
  it("distingue lo liberado de lo que no se confirmó", () => {
    const falla = { etapa: "Confirmación", proveedor: "Asistencia al viajero", liberados: ["AUT-1", "VUE-1", "HOT-1"] };
    expect(estadoServicios(reservaBase({ estado: "en_revision", falla })).map(item => item.estado)).toEqual(["Liberado", "Liberado", "No confirmado"]);
  });
  it("no solicita servicios si la autorización falló", () => {
    const falla = { etapa: "Autorización", proveedor: "Pasarela simulada", liberados: [] };
    expect(estadoServicios(reservaBase({ estado: "en_revision", falla })).map(item => item.estado)).toEqual(["Sin solicitar", "Sin solicitar", "Sin solicitar"]);
  });
});

describe("casos", () => {
  const caso: Caso = { id: "SOP-1", reserva: "MGT-1", etapa: "Reclamo", proveedor: "Soporte Digital", detalle: "Motivo", creado: "2026-01-01T00:00:00.000Z", automatico: false };

  it("conserva cada intervención al cerrar y reabrir", () => {
    const respondido = intervenir(caso, { autor: "Marina Ríos", rol: "Soporte" }, "respuesta", "Hola", "2026-01-01T01:00:00.000Z");
    const cerrado = cambiarEstado(respondido, "Marina Ríos", "Cerrado", "2026-01-01T02:00:00.000Z");
    expect(estadoCaso(cerrado)).toBe("Cerrado");
    expect(cerrado.cerrado).toBe("2026-01-01T02:00:00.000Z");
    const reabierto = cambiarEstado(cerrado, "Marina Ríos", "En gestión", "2026-01-01T03:00:00.000Z");
    expect(estadoCaso(reabierto)).toBe("En gestión");
    expect(reabierto.cerrado).toBeUndefined();
    expect(reabierto.intervenciones).toHaveLength(3);
    expect(caso.intervenciones).toBeUndefined();
  });
});

describe("cuenta", () => {
  it("solo vuelve a rutas internas", () => {
    expect(destinoSeguro("/pasajeros?id=1")).toBe("/pasajeros?id=1");
    expect(destinoSeguro("https://ejemplo.com")).toBe("/perfil");
    expect(destinoSeguro("//ejemplo.com")).toBe("/perfil");
    expect(destinoSeguro(undefined)).toBe("/perfil");
  });
});

describe("revalidación", () => {
  it("informa cupos firmados y conserva la cotización", () => {
    const resultado = validar(cotizar(busqueda, seleccion).token, "normal");
    if (resultado.tipo !== "lista") throw new Error("Se esperaba una tarifa estable.");
    expect(resultado.oferta.cotizacion.cupos?.vuelo).toBeGreaterThanOrEqual(busqueda.pasajeros);
    expect(resultado.oferta.cotizacion.cupos?.hotel).toBeGreaterThan(0);
  });
});

describe("documentos", () => {
  it("genera un PDF con la tabla de referencias correcta", () => {
    const bytes = crearPdf({ marca: "MARCA", referencia: "REF", titulo: "Voucher (hotel)", bajada: "Punta Cana → Bávaro", filas: [["Hotel", "Bahía Coral"]], pie: "Pie" });
    const pdf = String.fromCharCode(...bytes);
    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    expect(pdf).toContain("Voucher \\(hotel\\)");
    expect(pdf).toContain("Punta Cana -> B\xe1varo");
    const tabla = Number(pdf.match(/startxref\n(\d+)/)![1]);
    expect(pdf.slice(tabla, tabla + 4)).toBe("xref");
    const posiciones = [...pdf.slice(tabla).matchAll(/(\d{10}) 00000 n/g)].map(item => Number(item[1]));
    posiciones.forEach((posicion, i) => expect(pdf.slice(posicion).startsWith((i + 1) + " 0 obj")).toBe(true));
  });
});

describe("datos de ejemplo", () => {
  const demo = generarDemo();
  const clave = "96ad28b4-e12c-4675-8da9-97ceae23681a";

  it("mantiene localizadores estables entre cargas", () => {
    expect(Object.keys(generarDemo().reservas).sort()).toEqual(Object.keys(demo.reservas).sort());
    expect(Object.keys(generarDemo().casos).sort()).toEqual(Object.keys(demo.casos).sort());
  });
  it("vincula casos, chats y avisos con reservas existentes", () => {
    for (const caso of Object.values(demo.casos)) expect(demo.reservas[caso.reserva]).toBeDefined();
    for (const id of Object.keys(demo.chats)) expect(demo.reservas[id]).toBeDefined();
    for (const aviso of demo.avisos) expect(demo.reservas[aviso.reserva]).toBeDefined();
    expect(demo.reservas[demo.borrador.id].estado).toBe("cotizada");
  });
  it("cubre todos los estados que se muestran en las pantallas", () => {
    expect(new Set(Object.values(demo.reservas).map(item => item.estado))).toEqual(new Set(["emitida", "en_revision", "pago_autorizado", "cotizada"]));
    expect(new Set(Object.values(demo.casos).map(estadoCaso))).toEqual(new Set(["Abierto", "En gestión", "Esperando al viajero", "Cerrado"]));
    expect(new Set(demo.avisos.map(item => item.tipo))).toEqual(new Set(["Confirmación", "Variación", "Incidencia", "Caso"]));
  });
  it("firma las reservas para poder reintentarlas", () => {
    const enRevision = Object.values(demo.reservas).find(item => item.estado === "en_revision")!;
    expect(autorizar(enRevision.oferta.token, clave, "normal", true).aprobado).toBe(true);
  });
  it("asigna tantos pasajeros como viajeros tiene cada reserva", () => {
    for (const reserva of Object.values(demo.reservas).filter(item => item.estado !== "cotizada")) {
      expect(reserva.pasajeros).toHaveLength(reserva.oferta.cotizacion.busqueda.pasajeros);
    }
    expect(viajeros(usuarioActual(demo)!).length).toBeGreaterThanOrEqual(5);
  });
  it("incluye a los pasajeros en los vouchers", () => {
    const emitida = Object.values(demo.reservas).find(item => item.estado === "emitida")!;
    const fila = camposDocumento(emitida, "vuelo").find(([nombre]) => nombre === "Pasajeros");
    expect(fila?.[1]).toContain(emitida.pasajeros![0].nombre);
  });
});
