"use client";
import { useMemo, useSyncExternalStore } from "react";
import type { Borrador, Caso, Escenario, Mensaje, Reserva } from "./dominio";

type Datos = {
  reservas: Record<string, Reserva>; casos: Record<string, Caso>; chats: Record<string, Mensaje[]>;
  borrador?: Borrador; escenario: Escenario;
};

const clave = "mundoglobal.tpi.v1";
const aviso = "mundoglobal:actualizado";
const vacio: Datos = { reservas: {}, casos: {}, chats: {}, escenario: "normal" };
const vacioSerializado = JSON.stringify(vacio);
let memoria = vacioSerializado;
let soloMemoria = false;

function leerTexto() {
  if (typeof window === "undefined") return vacioSerializado;
  if (soloMemoria) return memoria;
  try {
    return window.localStorage.getItem(clave) ?? vacioSerializado;
  } catch {
    return memoria;
  }
}

function decodificar(valor: string): Datos {
  try {
    const datos = JSON.parse(valor) as Partial<Datos>;
    return { ...vacio, ...datos, reservas: datos.reservas ?? {}, casos: datos.casos ?? {}, chats: datos.chats ?? {} };
  } catch {
    return vacio;
  }
}

export const leer = () => decodificar(leerTexto());

export function actualizar(cambiar: (datos: Datos) => Datos) {
  memoria = JSON.stringify(cambiar(leer()));
  try {
    window.localStorage.setItem(clave, memoria);
  } catch {
    soloMemoria = true;
  }
  window.dispatchEvent(new Event(aviso));
}

export function guardarReserva(reserva: Reserva) {
  actualizar(datos => ({ ...datos, reservas: { ...datos.reservas, [reserva.id]: reserva } }));
}

function suscribir(callback: () => void) {
  const alCambiar = (event: StorageEvent) => { if (event.key === clave || event.key === null) callback(); };
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
