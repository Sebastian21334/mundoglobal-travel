"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { catalogo, origenes } from "@/lib/datos/catalogos";
import { codigoDestino, destinos } from "@/lib/datos/destinos";
import { escenarios, type Oferta, type Validacion } from "@/lib/dominio";
import { solicitar } from "@/lib/http";
import { procesarPago } from "@/lib/operacion";
import { nombreCompleto, usuarioActual } from "@/lib/cuenta";
import { cantidadViajeros, elegidos, fechaCorta, noches, usd } from "@/lib/precios";
import { registrar } from "@/lib/reserva";
import { guardarReserva, leer, useDatos } from "@/lib/storage";
import { ChatFlotante } from "./chat";
import { FotoHotel } from "./foto-hotel";
import { Etiqueta, ListaPasajeros, Pasos, SinDatos, Vigencia } from "./flujo";

export function PantallaPago({ id }: { id?: string }) {
  const { datos, listo } = useDatos();
  const router = useRouter();
  const bloqueo = useRef(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const reserva = datos.reservas[id ?? datos.borrador?.id ?? ""];
  if (!reserva) return <SinDatos listo={listo} mensaje="No encontramos una cotización validada en este navegador." />;
  if (reserva.estado !== "validada" && reserva.estado !== "pago_autorizado") return <main id="contenido" className="marco interior">
    <h1>{reserva.estado === "cotizada" ? "Primero, validá tu cotización." : "La reserva ya fue procesada."}</h1>
    <Link className="boton primario" href={reserva.estado === "cotizada" ? "/cotizacion" : "/reserva/" + reserva.id}>Continuar</Link>
  </main>;
  if (!reserva.pasajeros?.length) return <main id="contenido" className="marco interior">
    <p className="micro acento">PAGO / {reserva.id}</p><h1>Faltan los pasajeros.</h1>
    <p className="bajada">Asigná a cada viajero antes de autorizar el pago.</p>
    <Link className="boton primario" href={"/pasajeros?id=" + reserva.id}>Cargar pasajeros</Link>
  </main>;

  const { busqueda, seleccion, precios, vence, cupos } = reserva.oferta.cotizacion;
  const usuario = usuarioActual(datos);
  const items = elegidos(catalogo(busqueda), seleccion);
  const destino = destinos[codigoDestino(busqueda)];
  const reintento = reserva.historial.some(evento => evento.estado === "en_revision");
  const escenario = reserva.intento?.escenario ?? (reintento ? "recuperacion" : datos.escenario);
  const iniciada = Boolean(reserva.intento);

  async function enviar() {
    if (bloqueo.current) return;
    bloqueo.current = true;
    setOcupado(true);
    setError("");
    try {
      await procesarPago(reserva.id, escenario, reintento);
      const actual = leer().reservas[reserva.id];
      if (actual?.estado === "emitida" || actual?.estado === "en_revision") router.push("/reserva/" + reserva.id);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "La conexión se interrumpió. Podés continuar el mismo intento.");
    } finally {
      bloqueo.current = false;
      setOcupado(false);
    }
  }

  async function renovar() {
    if (bloqueo.current) return;
    bloqueo.current = true;
    setOcupado(true);
    setError("");
    try {
      const oferta = await solicitar<Oferta>("cotizar", { busqueda, seleccion, anterior: reserva.oferta.token, renovar: true });
      const resultado = await solicitar<Validacion>("validar", { token: oferta.token, escenario: "normal" });
      if (resultado.tipo === "lista") guardarReserva(registrar({ ...reserva, oferta: resultado.oferta, intento: undefined },
        "Se renovó la vigencia. El viajero debe autorizar el importe actualizado.", new Date().toISOString()), datos.generacion);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No pudimos actualizar los precios.");
    } finally {
      bloqueo.current = false;
      setOcupado(false);
    }
  }

  return <main id="contenido" className="marco interior">
    <Pasos actual={3}/>
    <div className="titulo-fila"><div><p className="micro acento">PAGO / {reserva.id}</p><h1>Revisá antes de pagar</h1></div><Vigencia hasta={vence}/></div>
    <p className="bajada">De {origenes[busqueda.origen]} a {destino.nombre} · {fechaCorta(busqueda.ida)} al {fechaCorta(busqueda.vuelta)} · {cantidadViajeros(busqueda.pasajeros)}</p>
    <div className="distribucion">
      <div className="pila">
      <section className="panel" aria-label="Detalle del paquete">
        <p className="micro acento">SERVICIOS QUE VAS A RESERVAR</p>
        <figure className="estadia-foto">
          <FotoHotel id={items.hotel.id} className="destino-foto" sizes="(max-width: 640px) 90vw, 450px"/>
          <figcaption className="nota">Foto de referencia del alojamiento simulado</figcaption>
        </figure>
        <dl className="lista-servicios">
          <div><dt>01 / Vuelo</dt><dd><strong>{items.vuelo.linea} · {items.vuelo.codigo}</strong><br/>{items.vuelo.salida} → {items.vuelo.llegada} · {items.vuelo.escala} · {items.vuelo.equipaje}</dd></div>
          <div><dt>02 / Hotel</dt><dd><strong>{items.hotel.nombre}</strong><br/>{noches(busqueda)} noches · {items.hotel.zona} · {items.hotel.politica}</dd></div>
          <div><dt>03 / Asistencia</dt><dd><strong>{items.asistencia.nombre}</strong><br/>{items.asistencia.incluye}</dd></div>
        </dl>
      </section>
      {cupos && <section className="panel" aria-labelledby="titulo-revalidacion">
        <p className="micro acento">REVALIDACIÓN ANTES DEL PAGO</p><h2 id="titulo-revalidacion">Precios y cupos verificados</h2>
        <ul className="servicios-estado">
          <li><div><strong>Vuelo</strong><p>Tarifa vigente</p></div><span className="servicios-ref">{cupos.vuelo} asientos libres</span><Etiqueta tono="ok">Disponible</Etiqueta></li>
          <li><div><strong>Hotel</strong><p>Tarifa vigente</p></div><span className="servicios-ref">{cupos.hotel} {cupos.hotel === 1 ? "habitación libre" : "habitaciones libres"}</span><Etiqueta tono="ok">Disponible</Etiqueta></li>
          <li><div><strong>Asistencia</strong><p>Tarifa vigente</p></div><span className="servicios-ref">Sin límite de cupos</span><Etiqueta tono="ok">Disponible</Etiqueta></li>
        </ul>
      </section>}
      <section className="panel" aria-labelledby="titulo-pasajeros-pago">
        <div className="titulo-fila"><div><p className="micro acento">QUIÉNES VIAJAN</p><h2 id="titulo-pasajeros-pago">Pasajeros</h2></div>
          {reserva.estado === "validada" && <Link href={"/pasajeros?id=" + reserva.id} className="enlace">Modificar</Link>}</div>
        <ListaPasajeros reserva={reserva}/>
      </section>
      </div>
      <aside className="resumen">
        <p className="micro acento">PASARELA SIMULADA</p><h2>{reintento ? "Nuevo intento" : "Autorización"}</h2>
        <fieldset className="tarjeta-prueba" disabled={ocupado}>
          <legend className="micro">Tarjeta de prueba</legend>
          <label>Titular<input readOnly value={usuario ? nombreCompleto(usuario) : nombreCompleto(reserva.pasajeros[0])}/></label>
          <label>Número<input readOnly value="4242 4242 4242 4242"/></label>
          <div className="campos-dobles"><label>Vencimiento<input readOnly value="12/29"/></label><label>CVV<input readOnly value="123"/></label></div>
        </fieldset>
        <div className="total"><span>Importe de la reserva</span><strong>{usd(precios.total)}</strong></div>
        <p className="nota">La pasarela simula la autorización y usa siempre esta tarjeta de prueba. El importe se captura cuando se confirman los tres servicios.</p>
        {escenario !== "normal" && escenario !== "tarifa" && <p className="micro mt-3 mb-3">Escenario · {escenarios[escenario]}</p>}
        {iniciada && <p className="nota mb-3">Hay un intento iniciado. Podés continuarlo con la misma referencia.</p>}
        <button type="button" className="boton primario w-full" disabled={ocupado} onClick={enviar}>
          {ocupado ? "Procesando la reserva…" : iniciada ? "Continuar el mismo intento" : "Autorizar pago simulado"}
        </button>
        <p role="status" className="nota mt-2">{ocupado ? (reserva.estado === "pago_autorizado" ? "Autorización obtenida. Confirmando servicios…" : "Verificando la autorización…") : ""}</p>
        {error && <p role="alert" className="error">{error}</p>}
        {reserva.estado === "validada" && <button type="button" className="enlace mt-2" disabled={ocupado} onClick={renovar}>Actualizar vigencia</button>}
      </aside>
    </div>
    <ChatFlotante id={reserva.id}/>
  </main>;
}
