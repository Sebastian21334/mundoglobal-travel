import { autorizar, confirmar, cotizar, validar } from "./checkout";
import { catalogo } from "./datos/catalogos";
import { viajeros } from "./cuenta";
import type { Aviso, Busqueda, Caso, Datos, Destino, Evento, Mensaje, Oferta, Origen, Pasajero, Reserva, Usuario } from "./dominio";
import { cambiarEstado, crearAviso, enlaceCaso, intervenir } from "./postventa";
import { isoDia, sumarDias } from "./precios";
import { firmar } from "./tokens";
import { detalleViaje } from "./viaje";

type Plan = { id: string; destino: Destino; origen: Origen; salida: number; noches: number; pasajeros: number; opcion: [number, number, number] };

const hora = 3_600_000;
const email = "valentina.ferreyra@example.com";
const titular = "Valentina Ferreyra";
const usuario: Usuario = {
  email, nombre: "Valentina", apellido: "Ferreyra", telefono: "+54 9 351 555-0142", documento: "AAF482117", nacimiento: "1991-03-14", nacionalidad: "Argentina",
  pasajeros: [
    { id: "demo-martin", nombre: "Martín", apellido: "Ferreyra", documento: "AAD903552", nacimiento: "1988-11-02", nacionalidad: "Argentina" },
    { id: "demo-lucia", nombre: "Lucía", apellido: "Ferreyra", documento: "AAG118204", nacimiento: "2014-06-21", nacionalidad: "Argentina" },
    { id: "demo-tomas", nombre: "Tomás", apellido: "Ferreyra", documento: "AAG118209", nacimiento: "2017-01-09", nacionalidad: "Argentina" },
    { id: "demo-clara", nombre: "Clara", apellido: "Medina", documento: "AAC771340", nacimiento: "1962-08-30", nacionalidad: "Uruguaya" },
  ],
};

const planes = {
  puntaCana: { id: "MGT-2026-7F3A1C", destino: "PUJ", origen: "EZE", salida: 35, noches: 7, pasajeros: 2, opcion: [0, 2, 1] },
  cancun: { id: "MGT-2026-B82E04", destino: "CUN", origen: "COR", salida: 62, noches: 10, pasajeros: 3, opcion: [0, 1, 2] },
  porto: { id: "MGT-2026-F1B273", destino: "REC", origen: "EZE", salida: 21, noches: 6, pasajeros: 2, opcion: [1, 1, 1] },
  arubaEmitida: { id: "MGT-2026-93CD10", destino: "AUA", origen: "COR", salida: 90, noches: 9, pasajeros: 2, opcion: [0, 2, 2] },
  aruba: { id: "MGT-2026-D19C55", destino: "AUA", origen: "EZE", salida: 48, noches: 6, pasajeros: 2, opcion: [1, 1, 1] },
  rechazada: { id: "MGT-2026-A03F6D", destino: "PUJ", origen: "COR", salida: 41, noches: 5, pasajeros: 1, opcion: [1, 0, 0] },
  autorizada: { id: "MGT-2026-E4470B", destino: "REC", origen: "COR", salida: 27, noches: 8, pasajeros: 4, opcion: [2, 0, 0] },
  borrador: { id: "MGT-2026-C6612A", destino: "CUN", origen: "EZE", salida: 33, noches: 7, pasajeros: 2, opcion: [0, 0, 1] },
} satisfies Record<string, Plan>;

// La clave se deriva del localizador para que recargar los datos no duplique incidencias.
const claveDe = (plan: Plan) => "96ad28b4-e12c-4675-8da9-97ceae" + plan.id.slice(-6).toLowerCase();
const incidencia = (plan: Plan) => "INC-" + claveDe(plan).replaceAll("-", "").slice(-10).toUpperCase();

function cotizada(plan: Plan, ahora: number): Oferta {
  const ida = sumarDias(isoDia(ahora), plan.salida);
  const busqueda: Busqueda = { origen: plan.origen, destino: plan.destino, ida, vuelta: sumarDias(ida, plan.noches), pasajeros: plan.pasajeros };
  const opciones = catalogo(busqueda);
  const seleccion = { vuelo: opciones.vuelos[plan.opcion[0]].id, hotel: opciones.hoteles[plan.opcion[1]].id, asistencia: opciones.asistencias[plan.opcion[2]].id };
  const cotizacion = { ...cotizar(busqueda, seleccion, undefined, ahora).cotizacion, id: plan.id };
  return { cotizacion, token: firmar("cotizacion", cotizacion) };
}

function validada(plan: Plan, ahora: number): Oferta {
  const resultado = validar(cotizada(plan, ahora).token, "normal", ahora);
  if (resultado.tipo !== "lista") throw new Error("La demo requiere una tarifa estable.");
  return resultado.oferta;
}

export function generarDemo(ahora = Date.now()) {
  const hace = (horas: number) => new Date(ahora - horas * hora).toISOString();
  const [valentina, martin, lucia, tomas, clara] = viajeros(usuario);

  function inicio(plan: Plan, horas: number, pasajeros: Pasajero[]) {
    const oferta = validada(plan, ahora);
    const historial: Evento[] = [
      { estado: "cotizada", fecha: hace(horas + .4), detalle: "Vuelo, hotel y asistencia cotizados en un paquete." },
      { estado: "validada", fecha: hace(horas + .3), detalle: "Tarifas y cupos validados con los tres proveedores." },
      { estado: "validada", fecha: hace(horas + .2), detalle: "Se asignaron " + pasajeros.length + " pasajeros a la reserva." },
    ];
    return { id: plan.id, oferta, historial, titular: email, pasajeros, cotizacionMs: 150_000 + plan.pasajeros * 21_000, importe: oferta.cotizacion.precios.total };
  }

  function emitida(plan: Plan, horas: number, pasajeros: Pasajero[], emisionMs: number): Reserva {
    const { importe, oferta, historial, ...base } = inicio(plan, horas, pasajeros);
    const clave = claveDe(plan);
    const pago = autorizar(oferta.token, clave, "normal", false, ahora);
    if (!pago.aprobado) throw new Error("La demo requiere un pago aprobado.");
    const confirmacion = confirmar(pago.recibo, plan.id, ahora);
    if (!confirmacion.emitida) throw new Error("La demo requiere una reserva emitida.");
    return {
      ...base, oferta, estado: "emitida", emisionMs, validacionMs: ahora - horas * hora,
      intento: { clave, escenario: "normal", reintento: false, recibo: pago.recibo },
      referencias: confirmacion.referencias, comprobante: confirmacion.comprobante,
      operaciones: [
        { fecha: hace(horas + .1), operacion: "Autorización", referencia: pago.autorizacion, resultado: "Aprobada", importe, detalle: "Clave de idempotencia " + clave.slice(0, 8) + "." },
        { fecha: hace(horas + .09), operacion: "Reenvío detectado", referencia: pago.autorizacion, resultado: "Sin nuevo cobro", importe: 0, detalle: "La misma clave devolvió la autorización original." },
        { fecha: hace(horas), operacion: "Captura", referencia: confirmacion.comprobante, resultado: "Cobrada", importe },
      ],
      historial: [...historial,
        { estado: "pago_autorizado", fecha: hace(horas + .1), detalle: "Autorización " + pago.autorizacion + ". El importe todavía no se capturó." },
        { estado: "confirmada", fecha: hace(horas + .02), detalle: "Vuelo, hotel y asistencia confirmados." },
        { estado: "emitida", fecha: hace(horas), detalle: "Pago capturado. Voucher de vuelo, hotel, póliza y comprobante emitidos." },
      ],
    };
  }

  function confirmacionParcial(plan: Plan, horas: number, pasajeros: Pasajero[]): { reserva: Reserva; detalle: string; proveedor: string; etapa: string } {
    const { importe, oferta, historial, ...base } = inicio(plan, horas, pasajeros);
    const clave = claveDe(plan);
    const pago = autorizar(oferta.token, clave, "parcial", false, ahora);
    if (!pago.aprobado) throw new Error("La demo requiere un pago aprobado.");
    const resultado = confirmar(pago.recibo, plan.id, ahora);
    if (resultado.emitida) throw new Error("La demo requiere una confirmación parcial.");
    const detalle = resultado.detalle + " Referencias liberadas: " + resultado.liberados.join(", ") + ".";
    return { detalle, proveedor: resultado.proveedor, etapa: resultado.etapa, reserva: {
      ...base, oferta, estado: "en_revision", intento: { clave, escenario: "parcial", reintento: false, recibo: pago.recibo },
      falla: { etapa: resultado.etapa, proveedor: resultado.proveedor, liberados: resultado.liberados },
      operaciones: [
        { fecha: hace(horas + .1), operacion: "Autorización", referencia: pago.autorizacion, resultado: "Aprobada", importe, detalle: "Clave de idempotencia " + clave.slice(0, 8) + "." },
        { fecha: hace(horas), operacion: "Liberación", referencia: resultado.liberados[0], resultado: "Liberada", importe },
      ],
      historial: [...historial,
        { estado: "pago_autorizado", fecha: hace(horas + .1), detalle: "Autorización " + pago.autorizacion + ". El importe todavía no se capturó." },
        { estado: "en_revision", fecha: hace(horas), detalle },
      ],
    } };
  }

  function pagoRechazado(plan: Plan, horas: number, pasajeros: Pasajero[]): { reserva: Reserva; detalle: string; proveedor: string } {
    const { importe, oferta, historial, ...base } = inicio(plan, horas, pasajeros);
    const clave = claveDe(plan);
    const pago = autorizar(oferta.token, clave, "rechazado", false, ahora);
    if (pago.aprobado) throw new Error("La demo requiere un pago rechazado.");
    return { detalle: pago.detalle, proveedor: pago.proveedor, reserva: {
      ...base, oferta, estado: "en_revision", intento: { clave, escenario: "rechazado", reintento: false },
      falla: { etapa: "Autorización", proveedor: pago.proveedor, liberados: [] },
      operaciones: [{ fecha: hace(horas), operacion: "Autorización", referencia: "Sin referencia", resultado: "Rechazada", importe, detalle: pago.detalle }],
      historial: [...historial, { estado: "en_revision", fecha: hace(horas), detalle: pago.detalle }],
    } };
  }

  function autorizada(plan: Plan, horas: number, pasajeros: Pasajero[]): Reserva {
    const { importe, oferta, historial, ...base } = inicio(plan, horas, pasajeros);
    const clave = claveDe(plan);
    const pago = autorizar(oferta.token, clave, "normal", false, ahora);
    if (!pago.aprobado) throw new Error("La demo requiere un pago aprobado.");
    return {
      ...base, oferta, estado: "pago_autorizado", intento: { clave, escenario: "normal", reintento: false, recibo: pago.recibo },
      operaciones: [{ fecha: hace(horas), operacion: "Autorización", referencia: pago.autorizacion, resultado: "Aprobada", importe, detalle: "Clave de idempotencia " + clave.slice(0, 8) + "." }],
      historial: [...historial, { estado: "pago_autorizado", fecha: hace(horas), detalle: "Autorización " + pago.autorizacion + ". El importe todavía no se capturó." }],
    };
  }

  const puntaCana = emitida(planes.puntaCana, 74, [valentina, martin], 41_000);
  const cancun = emitida(planes.cancun, 220, [valentina, martin, clara], 57_000);
  const porto = emitida(planes.porto, 150, [valentina, lucia], 36_000);
  const arubaEmitida = emitida(planes.arubaEmitida, 310, [martin, clara], 62_000);
  const parcial = confirmacionParcial(planes.aruba, 5, [valentina, martin]);
  const rechazo = pagoRechazado(planes.rechazada, 26, [clara]);
  const pendiente = autorizada(planes.autorizada, .2, [valentina, martin, lucia, tomas]);

  const borrador = cotizada(planes.borrador, ahora);
  const catalogoBorrador = catalogo(borrador.cotizacion.busqueda);
  const cotizadaDemo: Reserva = {
    id: planes.borrador.id, oferta: borrador, estado: "cotizada", cotizacionMs: 96_000,
    historial: [{ estado: "cotizada", fecha: hace(.05), detalle: "Vuelo, hotel y asistencia cotizados en un paquete." }],
  };

  const marina = "Marina Ríos";
  const soporte = { autor: marina, rol: "Soporte" } as const;
  const viajera = { autor: titular, rol: "Viajero" } as const;

  let cambioVuelo: Caso = {
    id: "SOP-4C21A9E0", reserva: puntaCana.id, etapa: "Solicitud de cambio", proveedor: "Soporte Digital", servicio: "Vuelo", automatico: false,
    detalle: "Necesito adelantar un día el vuelo de regreso por un compromiso laboral.", creado: hace(20), asignado: marina,
  };
  cambioVuelo = cambiarEstado(cambioVuelo, marina, "En gestión", hace(19.8));
  cambioVuelo = intervenir(cambioVuelo, soporte, "nota", "Consulté cupo con la aerolínea para el tramo de regreso. Hay lugares disponibles el día anterior.", hace(19.5));
  cambioVuelo = intervenir(cambioVuelo, soporte, "respuesta", "Hola, Valentina. Hay lugar en el vuelo del día anterior, con una diferencia de USD 48,00 por viajero. ¿Querés que avancemos con el cambio?", hace(19.4));
  cambioVuelo = intervenir(cambioVuelo, viajera, "respuesta", "Sí, avancemos con ese cambio. ¡Gracias!", hace(18));
  cambioVuelo = intervenir(cambioVuelo, soporte, "nota", "Pedido de reemisión enviado a la aerolínea. Queda pendiente su confirmación.", hace(17.6));

  let cambioHotel: Caso = {
    id: "SOP-8A77D1B3", reserva: cancun.id, etapa: "Solicitud de cambio", proveedor: "Soporte Digital", servicio: "Hotel", automatico: false,
    detalle: "Pedimos una habitación en planta baja por movilidad reducida de una de las pasajeras.", creado: hace(190), asignado: "Tomás Vidal",
  };
  cambioHotel = intervenir(cambioHotel, { autor: "Tomás Vidal", rol: "Soporte" }, "respuesta", "El hotel confirmó una habitación en planta baja sin costo adicional.", hace(189.85));
  cambioHotel = cambiarEstado(cambioHotel, "Tomás Vidal", "Cerrado", hace(189.8), "El hotel confirmó la habitación en planta baja.");

  const consulta: Caso = {
    id: "SOP-2F90C7E6", reserva: porto.id, etapa: "Consulta de cobertura", proveedor: "Soporte Digital", servicio: "Asistencia", automatico: false,
    detalle: "¿La asistencia cubre actividades náuticas como snorkel o paseos en catamarán?", creado: hace(3),
  };
  let reclamo: Caso = {
    id: "SOP-6DE31B08", reserva: arubaEmitida.id, etapa: "Reclamo", proveedor: "Soporte Digital", servicio: "Paquete completo", automatico: false,
    detalle: "No me llegó el comprobante de pago al correo y lo necesito para rendir gastos.", creado: hace(30), asignado: marina,
  };
  reclamo = cambiarEstado(reclamo, marina, "Esperando al viajero", hace(28));
  reclamo = intervenir(reclamo, soporte, "respuesta", "Podés descargarlo desde Mis viajes, en Documentos. ¿Nos confirmás si pudiste bajarlo?", hace(28));

  const automaticos: Caso[] = [
    { id: incidencia(planes.aruba), reserva: parcial.reserva.id, etapa: parcial.etapa, proveedor: parcial.proveedor, detalle: parcial.detalle, creado: hace(5), automatico: true },
    { id: incidencia(planes.rechazada), reserva: rechazo.reserva.id, etapa: "Autorización", proveedor: rechazo.proveedor, detalle: rechazo.detalle, creado: hace(26), automatico: true, asignado: "Julia Sosa", estado: "En gestión" },
  ];

  const mensaje = (id: string, autor: string, texto: string, horas: number): Mensaje => ({ id: "demo-" + id, autor, texto, fecha: hace(horas) });
  const chats: Record<string, Mensaje[]> = {
    [puntaCana.id]: [
      mensaje("p1", "Vos", "Hola, abrí un caso para adelantar la vuelta. ¿Hay novedades?", .03),
      mensaje("p2", marina, "Hola, Valentina. Tengo tu reserva y el caso SOP-4C21A9E0 a la vista. La aerolínea todavía no confirmó la reemisión.", .025),
      mensaje("p3", "Vos", "Perfecto, ¿el equipaje sigue igual?", .02),
      mensaje("p4", marina, "Sí, se mantiene: cabina de 10 kg y valija de 23 kg por viajero.", .015),
    ],
    [parcial.reserva.id]: [
      mensaje("a1", "Vos", "Me figura que la reserva quedó en revisión. ¿Me cobraron?", 4.5),
      mensaje("a2", marina, "No se realizó ningún cobro. La autorización y los cupos se liberaron porque la asistencia no confirmó. Podés reintentar desde la reserva.", 4.45),
    ],
    [planes.borrador.id]: [
      mensaje("b1", "Vos", "¿El plan Completo cubre demora de equipaje?", .05),
      mensaje("b2", "Tomás Vidal", "Sí, el plan Completo incluye urgencias, medicamentos y demora de equipaje.", .04),
    ],
  };

  const vuelo = detalleViaje(puntaCana).vuelo;
  const leido = (aviso: Aviso): Aviso => ({ ...aviso, leido: true });
  const avisos: Aviso[] = [
    crearAviso(planes.autorizada.id, "Confirmación", "Estamos confirmando tus servicios", "El pago está autorizado. El importe se cobra cuando se confirmen vuelo, hotel y asistencia.", hace(.2), "/reserva/" + planes.autorizada.id),
    crearAviso(consulta.reserva, "Caso", "Recibimos tu consulta " + consulta.id, "Soporte Digital va a responderte en este caso.", hace(3), enlaceCaso(consulta)),
    crearAviso(parcial.reserva.id, "Incidencia", "Tu reserva quedó en revisión", "El proveedor de asistencia no confirmó el servicio. No se realizó ningún cobro y podés reintentar.", hace(5), "/reserva/" + parcial.reserva.id),
    crearAviso(puntaCana.id, "Variación", "Cambió el horario de embarque", "La aerolínea adelantó 20 minutos el embarque del vuelo " + vuelo.codigo + ". El horario de salida se mantiene.", hace(9)),
    crearAviso(cambioVuelo.reserva, "Caso", "Soporte respondió tu caso " + cambioVuelo.id, "Hay lugar en el vuelo del día anterior, con una diferencia de USD 48,00 por viajero.", hace(19.4), enlaceCaso(cambioVuelo)),
    crearAviso(rechazo.reserva.id, "Incidencia", "El pago no se pudo autorizar", rechazo.detalle + " Podés reintentar desde la reserva.", hace(26), "/reserva/" + rechazo.reserva.id),
    leido(crearAviso(reclamo.reserva, "Caso", "Soporte respondió tu caso " + reclamo.id, "Podés descargar el comprobante desde Mis viajes, en Documentos.", hace(28), enlaceCaso(reclamo))),
    leido(crearAviso(puntaCana.id, "Confirmación", "Tu viaje a Punta Cana está confirmado", "Vuelo, hotel y asistencia confirmados. Ya podés descargar tus documentos.", hace(74))),
    leido(crearAviso(porto.id, "Confirmación", "Tu viaje a Porto de Galinhas está confirmado", "Vuelo, hotel y asistencia confirmados. Ya podés descargar tus documentos.", hace(150))),
    leido(crearAviso(cancun.id, "Confirmación", "Tu viaje a Cancún está confirmado", "Vuelo, hotel y asistencia confirmados. Ya podés descargar tus documentos.", hace(220))),
  ];

  const reservas = Object.fromEntries([arubaEmitida, cancun, porto, puntaCana, rechazo.reserva, parcial.reserva, pendiente, cotizadaDemo].map(item => [item.id, item]));
  const casos = Object.fromEntries([cambioHotel, reclamo, cambioVuelo, ...automaticos, consulta].map(item => [item.id, item]));

  return {
    reservas, casos, chats, avisos, cuentas: { [email]: usuario }, sesion: email,
    borrador: { id: planes.borrador.id, catalogo: catalogoBorrador, seleccion: borrador.cotizacion.seleccion },
  } satisfies Pick<Datos, "reservas" | "casos" | "chats" | "avisos" | "cuentas" | "sesion" | "borrador">;
}
