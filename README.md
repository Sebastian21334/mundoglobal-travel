# MundoGlobal Travel

Prototipo transaccional a medida del Grupo R para Reingeniería de Procesos de Negocio, UTN FRVM, TPI 2026. El piloto permite cotizar, reservar y consultar un viaje a Punta Cana con salida desde Córdoba o Buenos Aires. Todos los proveedores, medios de pago, tarifas y documentos son simulados.

## Ejecutar

Usá Node.js 22 o superior. En la carpeta del proyecto:

```sh
npm ci
npm run dev
```

En Windows también podés abrir `Iniciar.cmd` desde la carpeta. Ese archivo instala las dependencias si hace falta e inicia la web. Abrí http://localhost:3000. Para ejecutar la compilación de producción, corré `npm run build` y luego `npm start`. La compilación descarga Instrument Serif y Public Sans mediante next/font/google. La web sirve esas fuentes localmente.

## Recorrido de la exposición

1. Cotizá un paquete en la portada. Probá cambiar el vuelo, el hotel y la asistencia. El total se actualiza en el momento.
2. Validá la tarifa y los cupos. Revisá el total y autorizá el pago simulado.
3. Abrí el itinerario desde el ticket emitido. Probá un documento, la opción de imprimir y el chat.
4. Abrí un reclamo desde Mis viajes y revisalo en Soporte digital. El panel muestra los casos, las reservas en revisión y los indicadores de cotización y emisión.

El modo demostración se abre en el pie o con **Alt + Shift + D**. Seleccionalo antes de pulsar **Validar precio y cupos**.

| Escenario | Qué mostrar |
| --- | --- |
| Camino normal | Se autoriza el importe, se confirman los tres servicios, se captura y aparece el ticket. |
| Cambio de tarifa | Compará el total anterior, el nuevo y el vuelo alternativo. Elegí una opción antes de pagar. |
| Pago rechazado | La reserva queda en revisión y se abre un caso de autorización. El viajero puede reintentar. |
| Confirmación parcial | Vuelo y hotel responden, pero falla asistencia. Se compensan las confirmaciones y la autorización. |
| Recuperación tras reintento | La primera captura falla y se abre un caso. Usá **Reintentar reserva** y confirmá el nuevo intento. Se emite con el mismo localizador y se cierra el caso automático. |

## Implementación

- `app/api` concentra las respuestas simuladas y sus demoras. El servidor firma cotizaciones y recibos con HMAC. `MGT_SIGNING_SECRET` puede reemplazar el valor de demostración como variable privada opcional.
- `lib/reserva.ts` contiene las transiciones puras. `lib/precios.ts` calcula importes en centavos. Los hoteles aplican la tarifa base doble a todos los viajeros de la simulación. La asistencia se cobra por persona y por día de cobertura.
- `lib/storage.ts` guarda el registro versionado en el navegador. Soporte lee los datos del mismo dispositivo. El intento se guarda antes de llamar a la pasarela. Las referencias de autorización y captura son deterministas para el mismo intento. Las operaciones de un mismo navegador se coordinan mediante Web Locks cuando está disponible.
- El chat usa respuestas escritas para la demo y demoras simuladas. Los documentos se pueden imprimir desde el navegador.

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
