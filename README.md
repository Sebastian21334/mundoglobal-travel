# MundoGlobal Travel

Prototipo del Grupo R para Reingeniería de Procesos de Negocio, UTN FRVM, TPI 2026. Demuestra el flujo de la Acción 1, Plataforma web transaccional. El informe propone configurar una plataforma de reservas existente para la implantación (opción B). Este prototipo reproduce su alcance funcional con servicios simulados. Punta Cana fue el destino del piloto original. El catálogo ampliado permite cotizar, reservar y consultar viajes a Punta Cana, Cancún, Aruba y Porto de Galinhas con salida desde Córdoba o Buenos Aires. Todos los proveedores, medios de pago, tarifas y documentos son simulados.

## Ejecutar

Usá Node.js 22 o superior. En la carpeta del proyecto:

```sh
npm ci
npm run dev
```

En Windows también podés abrir `Iniciar.cmd` desde la carpeta. Ese archivo instala las dependencias si hace falta e inicia la web. Abrí http://localhost:3000. Para ejecutar la compilación de producción, corré `npm run build` y luego `npm start`. La compilación descarga Instrument Serif y Public Sans mediante next/font/google. La web sirve esas fuentes localmente.

## Recorrido de la exposición

1. Cotizá un paquete en la portada. Probá cambiar el vuelo, el hotel y la asistencia. El total se actualiza en el momento.
2. Validá la tarifa y los cupos. Ingresá o creá una cuenta y asigná los pasajeros.
3. Revisá el total y autorizá el pago simulado con la tarjeta de prueba.
4. Abrí el itinerario desde el ticket emitido. Probá un documento, la descarga en PDF y el chat.
5. Abrí un reclamo desde Mis viajes y atendelo en Soporte digital. Las respuestas llegan al seguimiento del caso y a Notificaciones.

El modo demostración se abre en el pie o con **Alt + Shift + D**. Seleccionalo antes de pulsar **Validar precio y cupos**.

| Escenario | Qué mostrar |
| --- | --- |
| Camino normal | Se autoriza el importe, se confirman los tres servicios, se captura y aparece el ticket. |
| Cambio de tarifa | Compará el total anterior, el nuevo y el vuelo alternativo. Elegí una opción antes de pagar. |
| Pago rechazado | La reserva queda en revisión y se abre un caso de autorización. El viajero puede reintentar. |
| Confirmación parcial | Vuelo y hotel responden, pero falla asistencia. Se compensan las confirmaciones y la autorización. |
| Recuperación tras reintento | La primera captura falla y se abre un caso. Usá **Reintentar reserva** y confirmá el nuevo intento. Se emite con el mismo localizador y se cierra el caso automático. |
| Doble envío del pago | El pago se envía dos veces con la misma clave. El registro muestra el reenvío detectado, sin nuevo cobro. |

**Cargar datos de ejemplo**, en Mi perfil o en el modo demostración, crea una cuenta con pasajeros, viajes en distintos estados, casos, avisos y conversaciones. El correo de acceso de Soporte digital aparece completado en el formulario.

En **Mi perfil → Restablecer demo**, podés confirmar el borrado de cuentas, cotizaciones, reservas, casos, avisos y conversaciones de MundoGlobal Travel guardados en ese navegador.

## Pantallas por funcionalidad

| Funcionalidad | Dónde verla |
| --- | --- |
| Usuarios y pasajeros | `/registro`, `/ingresar`, `/perfil`, `/pasajeros` |
| Búsqueda integrada | Portada, al pulsar **Cotizar paquete**, y franja de proveedores en `/cotizacion` |
| Armado del paquete | `/cotizacion` |
| Cotización completa | `/cotizacion`, resumen y **Condiciones de contratación** |
| Revalidación | Escenario **Cambio de tarifa** en `/cotizacion`, y **Precios y cupos verificados** en `/pago` |
| Pago electrónico | `/pago` y **Registro del pago** en `/reserva/[id]` |
| Reserva coordinada | **Estado de los servicios** en `/reserva/[id]` y `/mis-viajes/[id]` |
| Mis viajes | `/mis-viajes`, `/mis-viajes/[id]`, `/mis-viajes/[id]/documentos/[tipo]` |
| Notificaciones | `/notificaciones` |
| Cambios y reclamos | `/mis-viajes/[id]` y `/mis-viajes/[id]/casos/[caso]` |
| Chat humano | Botón flotante en `/cotizacion`, `/pasajeros` y `/pago`, y `/mis-viajes/[id]` |
| Panel de Soporte Digital | `/soporte`, `/soporte/reservas`, `/soporte/casos`, `/soporte/chats` |

## Implementación

- `app/api` concentra las respuestas simuladas y sus demoras. El servidor firma cotizaciones y recibos con HMAC. `MGT_SIGNING_SECRET` puede reemplazar el valor de demostración como variable privada opcional.
- `lib/reserva.ts` contiene las transiciones puras. `lib/precios.ts` calcula importes en centavos. Los hoteles aplican la tarifa base doble a todos los viajeros de la simulación. La asistencia se cobra por persona y por día de cobertura.
- `lib/storage.ts` guarda el registro versionado en el navegador. Soporte lee los datos del mismo dispositivo. El intento se guarda antes de llamar a la pasarela. Las referencias de autorización y captura son deterministas para el mismo intento. Las operaciones de un mismo navegador se coordinan mediante Web Locks cuando está disponible.
- El registro, el ingreso y el acceso de Soporte son simulados. Validan correos guardados en el navegador y no guardan contraseñas.
- El chat usa respuestas escritas para la demo y demoras simuladas. Los agentes también pueden responder desde `/soporte/chats`. Los documentos se descargan en PDF con `lib/pdf.ts` o se imprimen desde el navegador.

Una operación real necesitaría contratos y credenciales de proveedores, identidad y permisos por rol, almacenamiento compartido con un registro transaccional de idempotencia, webhooks, conciliación, política de compensación y gestión de datos personales.

## Controles

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

## Desplegar en Vercel

Subí el repositorio a Git, importalo desde el panel de Vercel y seleccioná el preset **Next.js**. La configuración predeterminada es suficiente para el prototipo. Consultá la [guía de Next.js en Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs).
