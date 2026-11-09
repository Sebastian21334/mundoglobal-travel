export type Origen = "COR" | "EZE";
export type Destino = "PUJ" | "CUN" | "AUA" | "REC";
export type Busqueda = { origen: Origen; destino?: Destino; ida: string; vuelta: string; pasajeros: number };
export type Seleccion = { vuelo: string; hotel: string; asistencia: string };
export type Vuelo = { id: string; linea: string; codigo: string; salida: string; llegada: string; regreso?: string; escala: string; duracion: string; equipaje: string; precio: number };
export type Hotel = { id: string; nombre: string; estrellas: number; zona: string; incluye: string; politica: string; precio: number };
export type Asistencia = { id: string; nombre: string; cobertura: number; incluye: string; precio: number };
export type Catalogo = { vuelos: Vuelo[]; hoteles: Hotel[]; asistencias: Asistencia[] };
export type Precios = { vuelo: number; hotel: number; asistencia: number; total: number };
export type Escenario = "normal" | "tarifa" | "rechazado" | "parcial" | "recuperacion" | "duplicado";
export type Estado = "cotizada" | "validada" | "pago_autorizado" | "confirmada" | "emitida" | "en_revision" | "cancelada";
export type Evento = { estado: Estado; fecha: string; detalle: string };
export type Cupos = { vuelo: number; hotel: number };
export type Cotizacion = {
  id: string; busqueda: Busqueda; seleccion: Seleccion; precios: Precios;
  recargo: number; vence: number; validada: boolean; cupos?: Cupos;
};
export type Oferta = { cotizacion: Cotizacion; token: string };
export type Validacion =
  | { tipo: "lista"; oferta: Oferta }
  | { tipo: "cambio"; anterior: number; oferta: Oferta; alternativa: Oferta; detalle: string };
export type Intento = { clave: string; escenario: Escenario; reintento: boolean; recibo?: string };
export type Pago = { aprobado: true; recibo: string; autorizacion: string } | { aprobado: false; proveedor: string; detalle: string };
export type Confirmacion =
  | { emitida: true; referencias: Referencias; comprobante: string }
  | { emitida: false; proveedor: string; etapa: string; detalle: string; liberados: string[] };
export type Referencias = { vuelo: string; hotel: string; asistencia: string };
export type Pasajero = { id: string; nombre: string; apellido: string; documento: string; nacimiento: string; nacionalidad: string };
export type Usuario = Omit<Pasajero, "id"> & { email: string; telefono: string; pasajeros: Pasajero[] };
export type OperacionPago = { fecha: string; operacion: string; referencia: string; resultado: string; importe: number; detalle?: string };
export type Falla = { etapa: string; proveedor: string; liberados: string[] };
export type Reserva = {
  id: string; estado: Estado; oferta: Oferta; historial: Evento[]; cotizacionMs: number;
  validacionMs?: number; emisionMs?: number; intento?: Intento; referencias?: Referencias; comprobante?: string;
  titular?: string; pasajeros?: Pasajero[]; operaciones?: OperacionPago[]; falla?: Falla;
};
export type EstadoCaso = "Abierto" | "En gestión" | "Esperando al viajero" | "Cerrado";
export type Intervencion = { id: string; autor: string; rol: "Viajero" | "Soporte"; tipo: "respuesta" | "nota" | "estado"; texto: string; fecha: string };
export type Caso = {
  id: string; reserva: string; etapa: string; proveedor: string; detalle: string;
  creado: string; cerrado?: string; resolucion?: string; automatico: boolean;
  servicio?: string; estado?: EstadoCaso; asignado?: string; intervenciones?: Intervencion[];
};
export type Mensaje = { id: string; autor: string; texto: string; fecha: string; disponible?: number };
export type Borrador = { id: string; catalogo: Catalogo; seleccion: Seleccion; cambio?: Extract<Validacion, { tipo: "cambio" }> };
export type TipoAviso = "Confirmación" | "Variación" | "Incidencia" | "Caso";
export type Aviso = { id: string; reserva: string; tipo: TipoAviso; titulo: string; detalle: string; fecha: string; leido?: boolean; enlace?: string };
export type Datos = {
  reservas: Record<string, Reserva>; casos: Record<string, Caso>; chats: Record<string, Mensaje[]>;
  avisos: Aviso[]; cuentas: Record<string, Usuario>; sesion?: string; agente?: string;
  borrador?: Borrador; escenario: Escenario; generacion: string;
};

export const escenarios: Record<Escenario, string> = {
  normal: "Camino normal", tarifa: "Cambio de tarifa", rechazado: "Pago rechazado",
  parcial: "Confirmación parcial", recuperacion: "Recuperación tras reintento", duplicado: "Doble envío del pago",
};
export const estados: Record<Estado, string> = {
  cotizada: "Cotizada", validada: "Validada", pago_autorizado: "Pago autorizado",
  confirmada: "Confirmada", emitida: "Emitida", en_revision: "En revisión", cancelada: "Cancelada",
};
