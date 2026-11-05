export function Mapa() {
  return <svg className="mapa" viewBox="0 0 580 440" role="img" aria-label="Mapa esquemático de la ruta entre Argentina y Punta Cana">
    <defs><pattern id="cuadricula" width="36" height="36" patternUnits="userSpaceOnUse"><path d="M36 0H0V36" fill="none" stroke="#88928b" strokeWidth=".55"/></pattern>
    <pattern id="grabado" width="7" height="7" patternUnits="userSpaceOnUse"><path d="m0 7 7-7" stroke="#183b43" strokeOpacity=".16" strokeWidth="1"/></pattern></defs>
    <rect width="580" height="440" fill="#e9e4d5"/><rect x="22" y="22" width="536" height="396" fill="url(#cuadricula)" stroke="#a5a69a"/>
    <path d="m85 22 42 37 31 12 9 21-11 16 23 22 35 4 14 18 38 11-12 17-25 0-32-19-37-8-16-21-29-10-12-32-32-12-29-53zm132 161 42 9 31-12 38 20 30 7 36 26-5 19-20 13-10 36-28 22-11 25-37 18-11 31-21 17-19-15 4-27-12-15 1-31-18-19-3-30-28-28-7-24 12-21zM306 99l24 2 17 11 31-4 13 8-19 8-34-5-31-2-16-11zm98 29 19-4 23 7-13 11-25-3z" fill="#c3c8a9" stroke="#657e73" strokeWidth="1.25"/>
    <path d="m85 22 42 37 31 12 9 21-11 16 23 22 35 4 14 18 38 11-12 17-25 0-32-19-37-8-16-21-29-10-12-32-32-12-29-53zm132 161 42 9 31-12 38 20 30 7 36 26-5 19-20 13-10 36-28 22-11 25-37 18-11 31-21 17-19-15 4-27-12-15 1-31-18-19-3-30-28-28-7-24 12-21z" fill="url(#grabado)"/>
    <path d="M269 355Q292 195 425 132M240 346Q180 232 425 132" stroke="#a0442d" fill="none" strokeWidth="2" strokeDasharray="5 6"/>
    <g fill="#a0442d"><circle cx="269" cy="355" r="5"/><circle cx="240" cy="346" r="4"/><circle cx="425" cy="132" r="8"/></g>
    <circle cx="425" cy="132" r="15" fill="none" stroke="#a0442d"/>
    <g fill="#233d44" fontFamily="monospace" fontSize="12" fontWeight="bold" letterSpacing="1">
      <text x="444" y="137">PUJ</text><text x="280" y="360">EZE</text><text x="205" y="346">COR</text>
      <text x="39" y="50" fontSize="10">TRAZADO 01 / CARIBE</text><text x="374" y="400" fontSize="10">18°34′ N  ·  68°22′ O</text>
    </g>
    <path d="M514 46v37m-11-23 11-13 11 13m-15 22h8" fill="none" stroke="#34515b" strokeWidth="1.15"/>
  </svg>;
}
