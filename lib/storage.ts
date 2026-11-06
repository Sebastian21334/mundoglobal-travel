"use client";
import { useMemo, useSyncExternalStore } from "react";
import type { Borrador, Caso, Escenario, Mensaje, Reserva } from "./dominio";

type Datos = {
  reservas: Record<string, Reserva>; casos: Record<string, Caso>; chats: Record<string, Mensaje[]>;
  borrador?: Borrador; escenario: Escenario; generacion: string;
};

const clave = "mundoglobal.tpi.v1";
const claveReinicio = "mundoglobal.tpi.reset";
const aviso = "mundoglobal:actualizado";
const inicial = "inicial";
const vacio: Datos = { reservas: {}, casos: {}, chats: {}, escenario: "normal", generacion: inicial };
const vacioSerializado = inicial + "|";
let memoria = vacioSerializado;
let soloMemoria = false;

function leerTexto() {
  if (typeof window === "undefined") return vacioSerializado;
  if (soloMemoria) return memoria;
  try {
    const generacion = window.localStorage.getItem(claveReinicio) ?? inicial;
    return generacion + "|" + (window.localStorage.getItem(clave) ?? "");
  } catch {
    return memoria;
  }
}

function decodificar(valor: string): Datos {
  const separador = valor.indexOf("|");
  const generacion = valor.slice(0, separador);
  const contenido = valor.slice(separador + 1);
  if (!contenido) return { ...vacio, generacion };
  try {
    const datos = JSON.parse(contenido) as Partial<Datos>;
    // Ignorá escrituras rezagadas de otra pestaña que todavía tenía una operación en curso.
    if ((datos.generacion ?? inicial) !== generacion) return { ...vacio, generacion };
    return { ...vacio, ...datos, generacion, reservas: datos.reservas ?? {}, casos: datos.casos ?? {}, chats: datos.chats ?? {} };
  } catch {
    return { ...vacio, generacion };
  }
}

export const leer = () => decodificar(leerTexto());

export function actualizar(cambiar: (datos: Datos) => Datos, generacionEsperada?: string) {
  const datos = leer();
  if (generacionEsperada !== undefined && generacionEsperada !== datos.generacion) return false;
  const contenido = JSON.stringify({ ...cambiar(datos), generacion: datos.generacion });
  memoria = datos.generacion + "|" + contenido;
  try {
    window.localStorage.setItem(clave, contenido);
  } catch {
    soloMemoria = true;
  }
  window.dispatchEvent(new Event(aviso));
  return true;
}

export function guardarReserva(reserva: Reserva, generacion: string) {
  return actualizar(datos => ({ ...datos, reservas: { ...datos.reservas, [reserva.id]: reserva } }), generacion);
}

export function restablecerDemo() {
  const generacion = window.crypto.randomUUID();
  memoria = generacion + "|";
  try {
    window.localStorage.setItem(claveReinicio, generacion);
    window.localStorage.removeItem(clave);
    soloMemoria = false;
    return true;
  } catch {
    soloMemoria = true;
    return false;
  } finally {
    window.dispatchEvent(new Event(aviso));
  }
}

function suscribir(callback: () => void) {
  const alCambiar = (event: StorageEvent) => {
    if (event.key === clave || event.key === claveReinicio || event.key === null) callback();
  };
  window.addEventListener(aviso, callback);
  window.addEventListener("storage", alCambiar);
  return () => {
    window.removeEventListener(aviso, callback);
    window.removeEventListener("storage", alCambiar);
  };
}

const sinSuscripcion = () => () => {};
export function useDatos() {
  const raw = useSyncExternalStore(suscribir, leerTexto, () => vacioSerializado);
  const listo = useSyncExternalStore(sinSuscripcion, () => true, () => false);
  return { datos: useMemo(() => decodificar(raw), [raw]), listo };
}
