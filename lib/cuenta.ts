import type { Datos, Pasajero, Usuario } from "./dominio";

export const usuarioActual = (datos: Pick<Datos, "cuentas" | "sesion">): Usuario | undefined =>
  datos.sesion ? datos.cuentas[datos.sesion] : undefined;

export const nombreCompleto = ({ nombre, apellido }: { nombre: string; apellido: string }) => nombre + " " + apellido;

export const titularDe = (usuario: Usuario): Pasajero => ({
  id: "titular", nombre: usuario.nombre, apellido: usuario.apellido, documento: usuario.documento,
  nacimiento: usuario.nacimiento, nacionalidad: usuario.nacionalidad,
});

export const viajeros = (usuario: Usuario) => [titularDe(usuario), ...usuario.pasajeros];

export const fechaCompleta = (fecha: string) =>
  new Intl.DateTimeFormat("es-AR", { timeZone: "UTC" }).format(new Date(fecha + "T00:00:00Z"));

// Solo se aceptan rutas internas para que el regreso tras el acceso no salga del sitio.
export const destinoSeguro = (volver?: string, alternativa = "/perfil") =>
  volver && volver.startsWith("/") && !volver.startsWith("//") ? volver : alternativa;
