type Contenido = { marca: string; referencia: string; titulo: string; bajada: string; filas: [string, string][]; pie: string };

const limpiar = (texto: string) => texto.replace(/→/g, "->").replace(/[–—]/g, "-").replace(/…/g, "...").replace(/[^\x20-\xff]/g, "?");
const literal = (texto: string) => "(" + limpiar(texto).replace(/[\\()]/g, "\\$&") + ")";

function partir(texto: string, ancho: number) {
  const lineas: string[] = [];
  let actual = "";
  for (const palabra of texto.split(" ")) {
    if (actual && (actual + " " + palabra).length > ancho) { lineas.push(actual); actual = palabra; }
    else actual = actual ? actual + " " + palabra : palabra;
  }
  return [...lineas, actual];
}

// PDF de una página con fuentes estándar: alcanza para los comprobantes y no suma dependencias.
export function crearPdf({ marca, referencia, titulo, bajada, filas, pie }: Contenido) {
  const salida = ["0.09 0.17 0.2 rg"];
  const escribir = (x: number, y: number, fuente: string, tam: number, texto: string) =>
    salida.push(`BT /${fuente} ${tam} Tf ${x} ${y} Td ${literal(texto)} Tj ET`);
  const regla = (y: number) => salida.push(`0.72 0.71 0.65 RG 0.6 w 50 ${y} m 545 ${y} l S`);

  escribir(50, 790, "F2", 8, marca);
  escribir(50, 778, "F1", 8, referencia);
  regla(768);
  escribir(50, 730, "F2", 28, titulo);
  escribir(50, 708, "F1", 11, bajada);
  let y = 678;
  for (const [nombre, valor] of filas) {
    regla(y + 14);
    escribir(50, y, "F2", 10, nombre);
    for (const linea of partir(valor, 66)) { escribir(205, y, "F1", 10, linea); y -= 14; }
    y -= 12;
  }
  regla(y + 14);
  escribir(50, y - 8, "F1", 8, pie);

  const contenido = salida.join("\n");
  const objetos = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    `<< /Length ${contenido.length} >>\nstream\n${contenido}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const posiciones = objetos.map((objeto, i) => {
    const posicion = pdf.length;
    pdf += `${i + 1} 0 obj\n${objeto}\nendobj\n`;
    return posicion;
  });
  const tabla = pdf.length;
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n` + posiciones.map(p => String(p).padStart(10, "0") + " 00000 n \n").join("");
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${tabla}\n%%EOF\n`;
  return Uint8Array.from(pdf, letra => letra.charCodeAt(0));
}
