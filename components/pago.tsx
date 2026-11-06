"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { catalogo, origenes } from "@/lib/datos/catalogos";
import { codigoDestino, destinos } from "@/lib/datos/destinos";
import { escenarios, type Oferta, type Validacion } from "@/lib/dominio";
import { solicitar } from "@/lib/http";
import { procesarPago } from "@/lib/operacion";
import { elegidos, fechaCorta, noches, usd } from "@/lib/precios";
import { registrar } from "@/lib/reserva";
import { guardarReserva, leer, useDatos } from "@/lib/storage";
import { Pasos, SinDatos, Vigencia } from "./flujo";

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

  const { busqueda, seleccion, precios, vence } = reserva.oferta.cotizacion;
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
    <Pasos actual={2}/>
    <div className="titulo-fila"><div><p className="micro acento">PAGO / {reserva.id}</p><h1>Revisá antes de pagar</h1></div><Vigencia hasta={vence}/></div>
    <p className="bajada">De {origenes[busqueda.origen]} a {destino.nombre} · {fechaCorta(busqueda.ida)} al {fechaCorta(busqueda.vuelta)} · {busqueda.pasajeros} viajeros</p>
    <div className="distribucion">
      <section className="panel" aria-label="Detalle del paquete">
        <p className="micro acento">SERVICIOS QUE VAS A RESERVAR</p>
        <dl className="lista-servicios">
          <div><dt>01 / Vuelo</dt><dd><strong>{items.vuelo.linea} · {items.vuelo.codigo}</strong><br/>{items.vuelo.salida} → {items.vuelo.llegada} · {items.vuelo.escala} · {items.vuelo.equipaje}</dd></div>
          <div><dt>02 / Hotel</dt><dd><strong>{items.hotel.nombre}</strong><br/>{noches(busqueda)} noches · {items.hotel.zona} · {items.hotel.politica}</dd></div>
          <div><dt>03 / Asistencia</dt><dd><strong>{items.asistencia.nombre}</strong><br/>{items.asistencia.incluye}</dd></div>
        </dl>
      </section>
      <aside className="resumen">
        <p className="micro acento">PASARELA SIMULADA</p><h2>{reintento ? "Nuevo intento" : "Autorización"}</h2>
        <div className="total"><span>Importe de la reserva</span><strong>{usd(precios.total)}</strong></div>
        <p className="nota">La pasarela simula la autorización. El importe se captura en la simulación cuando se confirman los tres servicios.</p>
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
  </main>;
}
