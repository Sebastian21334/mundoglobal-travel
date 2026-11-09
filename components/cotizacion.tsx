"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { origenes } from "@/lib/datos/catalogos";
import { codigoDestino, destinos } from "@/lib/datos/destinos";
import type { Oferta, Seleccion, Validacion } from "@/lib/dominio";
import { solicitar } from "@/lib/http";
import { guardarValidacion } from "@/lib/operacion";
import { crearAviso } from "@/lib/postventa";
import { calcularPrecios, cantidadViajeros, elegidos, fechaCorta, mismaSeleccion, noches, usd } from "@/lib/precios";
import { registrar } from "@/lib/reserva";
import { actualizar, guardarReserva, leer, useDatos } from "@/lib/storage";
import { ChatFlotante } from "./chat";
import { FotoHotel } from "./foto-hotel";
import { Pasos, SinDatos, Vigencia } from "./flujo";

export function Cotizador() {
  const router = useRouter();
  const { datos, listo } = useDatos();
  const bloqueo = useRef(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const borrador = datos.borrador;
  const reserva = borrador && datos.reservas[borrador.id];
  if (!reserva || !borrador) return <SinDatos listo={listo} mensaje="La cotización de este navegador todavía está vacía." />;
  if (reserva.estado !== "cotizada") return <main id="contenido" className="marco interior">
    <p className="micro acento">RESERVA / {reserva.id}</p><h1>Tu cotización ya avanzó.</h1>
    <div className="acciones"><Link href={reserva.estado === "validada" || reserva.estado === "pago_autorizado" ? (reserva.pasajeros?.length ? "/pago?id=" : "/pasajeros?id=") + reserva.id : "/reserva/" + reserva.id} className="boton primario">Continuar con la reserva</Link><Link href="/" className="boton">Nueva búsqueda</Link></div>
  </main>;

  const { busqueda } = reserva.oferta.cotizacion;
  const codigo = codigoDestino(busqueda);
  const destino = destinos[codigo];
  const { catalogo, seleccion, cambio } = borrador;
  const recargo = reserva.oferta.cotizacion.seleccion.vuelo === seleccion.vuelo ? reserva.oferta.cotizacion.recargo : 0;
  const precios = calcularPrecios(busqueda, catalogo, seleccion, recargo);
  const dias = noches(busqueda);
  const alternativa = cambio ? elegidos(catalogo, cambio.alternativa.cotizacion.seleccion).vuelo : null;
  const servicios = elegidos(catalogo, seleccion);
  const lineas = [...new Set(catalogo.vuelos.map(item => item.linea))].join(" · ");
  const venceA = new Date(reserva.oferta.cotizacion.vence).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

  function elegir(tipo: keyof Seleccion, id: string) {
    setError("");
    actualizar(actual => ({
      ...actual, borrador: actual.borrador?.id === reserva!.id
        ? { ...actual.borrador, seleccion: { ...actual.borrador.seleccion, [tipo]: id }, cambio: undefined }
        : actual.borrador,
    }));
  }

  async function operar(renovar = false) {
    if (bloqueo.current || !borrador || !reserva) return;
    bloqueo.current = true;
    setOcupado(true);
    setError("");
    try {
      let actual = reserva;
      if (renovar || !mismaSeleccion(reserva.oferta.cotizacion.seleccion, seleccion)) {
        const oferta = await solicitar<Oferta>("cotizar", { busqueda, seleccion, anterior: reserva.oferta.token, renovar });
        actual = { ...reserva, oferta };
        if (!guardarReserva(actual, datos.generacion)) return;
      }
      if (renovar) {
        actualizar(d => ({ ...d, borrador: d.borrador?.id === actual.id ? { ...d.borrador, cambio: undefined } : d.borrador }), datos.generacion);
        return;
      }
      const resultado = await solicitar<Validacion>("validar", { token: actual.oferta.token, escenario: leer().escenario });
      if (resultado.tipo === "cambio") {
        const anotada = registrar(actual, resultado.detalle + " Se presentaron el precio actualizado y otro vuelo.", new Date().toISOString());
        actualizar(d => ({
          ...d, escenario: "normal", reservas: { ...d.reservas, [actual.id]: anotada },
          borrador: d.borrador?.id === actual.id ? { ...d.borrador, cambio: resultado } : d.borrador,
          avisos: [crearAviso(actual.id, "Variación", "Cambió la tarifa aérea de tu cotización", resultado.detalle, undefined, "/cotizacion"), ...d.avisos],
        }), datos.generacion);
      } else if (guardarValidacion(actual, resultado.oferta, "Tarifas y cupos validados con los tres proveedores.", datos.generacion)) {
        router.push("/pasajeros?id=" + reserva.id);
      }
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No pudimos validar la reserva. Intentá otra vez.");
    } finally {
      bloqueo.current = false;
      setOcupado(false);
    }
  }

  function aceptar(oferta: Oferta, detalle: string) {
    if (!reserva || bloqueo.current) return;
    if (oferta.cotizacion.vence <= Date.now()) { setError("La oferta venció. Actualizá los precios antes de continuar."); return; }
    bloqueo.current = true;
    if (guardarValidacion(reserva, oferta, detalle, datos.generacion)) router.push("/pasajeros?id=" + reserva.id);
  }

  return <main id="contenido" className="marco interior">
    <Pasos actual={cambio ? 1 : 0}/>
    <div className="titulo-fila"><div><p className="micro acento">{codigo} / {reserva.id}</p><h1>Tu paquete a {destino.nombre}</h1></div>
      <Vigencia hasta={reserva.oferta.cotizacion.vence}/></div>
    <p className="bajada">{origenes[busqueda.origen]} · {fechaCorta(busqueda.ida)} al {fechaCorta(busqueda.vuelta)} · {cantidadViajeros(busqueda.pasajeros)} · {dias} noches</p>
    <ul className="proveedores" aria-label="Respuesta de los proveedores consultados">
      <li><span className="micro">AEROLÍNEAS</span><strong>{catalogo.vuelos.length} tarifas disponibles</strong><p>{lineas}</p></li>
      <li><span className="micro">HOTELES ALL INCLUSIVE</span><strong>{catalogo.hoteles.length} hoteles disponibles</strong><p>{destino.zona}</p></li>
      <li><span className="micro">ASISTENCIA AL VIAJERO</span><strong>{catalogo.asistencias.length} planes disponibles</strong><p>Hasta {usd(Math.max(...catalogo.asistencias.map(item => item.cobertura)) * 100)} de tope médico</p></li>
    </ul>
    <div className="acceso-resumen"><div><span className="micro">TOTAL DE LA RESERVA</span><strong aria-live="polite">{usd(precios.total)}</strong></div><a href="#resumen-cotizacion" className="boton">Ver resumen ↓</a></div>
    <div className="distribucion">
      <div className="opciones">
        <fieldset disabled={ocupado || Boolean(cambio)}><legend><span>01 /</span> Vuelo ida y vuelta</legend>
          {catalogo.vuelos.map(item => <label key={item.id} className="opcion">
            <input type="radio" name="vuelo" checked={seleccion.vuelo === item.id} onChange={() => elegir("vuelo", item.id)}/>
            <span className="opcion-cuerpo"><strong>{item.linea} <small>{item.codigo}</small></strong><span>{item.salida} → {item.llegada} · {item.duracion} · {item.escala}</span><span>{item.equipaje}</span></span>
            <span className="opcion-precio">{usd(item.precio + (item.id === seleccion.vuelo ? recargo : 0))}<small>por viajero</small></span>
          </label>)}
        </fieldset>
        <fieldset disabled={ocupado || Boolean(cambio)}><legend><span>02 /</span> Hotel All Inclusive</legend>
          <p className="nota mt-2 mb-1">Fotos de referencia para los hoteles simulados.</p>
          {catalogo.hoteles.map(item => <label key={item.id} className="opcion opcion-hotel">
            <input type="radio" name="hotel" checked={seleccion.hotel === item.id} onChange={() => elegir("hotel", item.id)}/>
            <FotoHotel id={item.id} className="hotel-miniatura" sizes="(max-width: 570px) 225px, 144px"/>
            <span className="opcion-cuerpo"><strong>{item.nombre}</strong><span>{item.zona} · {item.estrellas} estrellas</span><span>{item.incluye}</span><span>{item.politica}</span></span>
            <span className="opcion-precio">{usd(item.precio)}<small>por noche y viajero, base doble</small></span>
          </label>)}
        </fieldset>
        <fieldset disabled={ocupado || Boolean(cambio)}><legend><span>03 /</span> Asistencia al viajero</legend>
          {catalogo.asistencias.map(item => <label key={item.id} className="opcion">
            <input type="radio" name="asistencia" checked={seleccion.asistencia === item.id} onChange={() => elegir("asistencia", item.id)}/>
            <span className="opcion-cuerpo"><strong>{item.nombre}</strong><span>Gastos médicos hasta {usd(item.cobertura * 100)}.</span><span>{item.incluye}</span></span>
            <span className="opcion-precio">{usd(item.precio)}<small>por día y viajero</small></span>
          </label>)}
        </fieldset>
        <section className="panel" aria-labelledby="titulo-condiciones">
          <p className="micro acento">ANTES DE RESERVAR</p><h2 id="titulo-condiciones">Condiciones de contratación</h2>
          <dl className="lista-servicios">
            <div><dt>Vigencia</dt><dd>La cotización se mantiene hasta las {venceA}. Después hay que actualizar precios y cupos.</dd></div>
            <div><dt>Vuelo</dt><dd>{servicios.vuelo.equipaje} por viajero. La tarifa se confirma al revalidar, antes del pago.</dd></div>
            <div><dt>Hotel</dt><dd>{servicios.hotel.politica} Tarifa en base doble, ingreso desde las 15:00.</dd></div>
            <div><dt>Asistencia</dt><dd>Plan {servicios.asistencia.nombre}, del {fechaCorta(busqueda.ida)} al {fechaCorta(busqueda.vuelta)}. Tope médico de {usd(servicios.asistencia.cobertura * 100)} por viajero.</dd></div>
            <div><dt>Pago</dt><dd>El importe se autoriza al pagar y se cobra cuando se confirman los tres servicios. Si alguno falla, la autorización se libera.</dd></div>
            <div><dt>Cambios</dt><dd>Se solicitan desde Mis viajes y quedan sujetos a las políticas de cada proveedor.</dd></div>
          </dl>
        </section>
      </div>
      <aside id="resumen-cotizacion" tabIndex={-1} className="resumen" aria-label="Resumen de cotización">
        {!cambio && <Image src={destino.foto.src} alt={destino.foto.alt} width={960} height={640} sizes="(max-width: 850px) 90vw, 290px" className="destino-foto resumen-foto"/>}
        <p className="micro acento">UNA SOLA RESERVA</p><h2>Resumen</h2>
        <dl className="desglose">
          <div><dt>Vuelo<small>{servicios.vuelo.linea} · {servicios.vuelo.codigo}</small></dt><dd>{usd(precios.vuelo)}</dd></div>
          <div><dt>Hotel<small>{servicios.hotel.nombre} · {dias} noches</small></dt><dd>{usd(precios.hotel)}</dd></div>
          <div><dt>Asistencia<small>Plan {servicios.asistencia.nombre} · {dias + 1} días</small></dt><dd>{usd(precios.asistencia)}</dd></div>
        </dl>
        <div className="total" aria-live="polite"><span>Total de la reserva</span><strong key={precios.total}>{usd(precios.total)}</strong></div>
        {cambio && <div className="aviso" aria-live="polite" data-testid="cambio-tarifa">
          <h3>Cambió la tarifa aérea</h3><p>{cambio.detalle}</p>
          <p>Antes <del>{usd(cambio.anterior)}</del></p><p>Ahora <strong>{usd(cambio.oferta.cotizacion.precios.total)}</strong></p>
          <button type="button" className="boton primario w-full" onClick={() => aceptar(cambio.oferta, "El viajero aceptó la tarifa aérea actualizada.")}>Aceptar nuevo precio</button>
          <button type="button" className="boton w-full" onClick={() => aceptar(cambio.alternativa, "El viajero eligió el vuelo alternativo " + alternativa?.codigo + ".")}>
            Elegir vuelo alternativo · {usd(cambio.alternativa.cotizacion.precios.total)}
          </button><p>{alternativa?.linea} · {alternativa?.salida} → {alternativa?.llegada} · {alternativa?.escala}</p>
        </div>}
        {!cambio && <button className="boton primario w-full" type="button" disabled={ocupado} onClick={() => operar()}>
          {ocupado ? "Consultando disponibilidad…" : "Validar precio y cupos"}
        </button>}
        {error && <p className="error" role="alert">{error}</p>}
        <button className="enlace mt-2" type="button" disabled={ocupado} onClick={() => operar(true)}>Actualizar cotización</button>
        <Link href="/" className="enlace mt-1 block">Cambiar fechas u origen</Link>
      </aside>
    </div>
    <ChatFlotante id={reserva.id}/>
  </main>;
}
