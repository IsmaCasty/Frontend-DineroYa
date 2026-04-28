// Decoraciones SVG doradas para el layout publico.
// Usa el dorado de marca (#c9a227) hardcoded para evitar depender de
// variables CSS que pueden no estar resueltas en tiempo de render.

export function DecoracionesJoyas() {
  // Dorado de marca. Hardcoded a proposito: estas decoraciones
  // son identidad visual, no deben cambiar con el tema.
  const DORADO = "#c9a227";

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Anillo doble grande - esquina superior izquierda */}
      <svg
        viewBox="0 0 200 200"
        className="absolute -left-20 -top-20 h-80 w-80"
        style={{ opacity: 0.18, transform: "rotate(-15deg)" }}
      >
        <circle
          cx="100"
          cy="100"
          r="80"
          fill="none"
          stroke={DORADO}
          strokeWidth="3"
        />
        <circle
          cx="100"
          cy="100"
          r="60"
          fill="none"
          stroke={DORADO}
          strokeWidth="1.5"
        />
        {/* Piedra superior engastada */}
        <polygon
          points="100,10 110,30 100,50 90,30"
          fill={DORADO}
          opacity="0.7"
        />
      </svg>

      {/* Gema facetada grande - esquina inferior derecha */}
      <svg
        viewBox="0 0 200 200"
        className="absolute -bottom-16 -right-16 h-96 w-96"
        style={{ opacity: 0.16, transform: "rotate(12deg)" }}
      >
        <polygon
          points="100,20 170,80 140,180 60,180 30,80"
          fill="none"
          stroke={DORADO}
          strokeWidth="3"
        />
        <polygon
          points="100,20 140,80 100,180 60,80"
          fill="none"
          stroke={DORADO}
          strokeWidth="1.5"
        />
        <line
          x1="30"
          y1="80"
          x2="170"
          y2="80"
          stroke={DORADO}
          strokeWidth="1.5"
        />
      </svg>

      {/* Anillo mediano - esquina inferior izquierda */}
      <svg
        viewBox="0 0 100 100"
        className="absolute -bottom-8 left-12 h-40 w-40 md:left-24"
        style={{ opacity: 0.15 }}
      >
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={DORADO}
          strokeWidth="2"
        />
        <circle
          cx="50"
          cy="50"
          r="32"
          fill="none"
          stroke={DORADO}
          strokeWidth="1"
        />
      </svg>

      {/* Anillo pequeno adicional - esquina superior derecha */}
      <svg
        viewBox="0 0 100 100"
        className="absolute right-16 top-24 h-28 w-28"
        style={{ opacity: 0.14, transform: "rotate(25deg)" }}
      >
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={DORADO}
          strokeWidth="2"
        />
        <polygon
          points="50,5 55,18 50,30 45,18"
          fill={DORADO}
          opacity="0.6"
        />
      </svg>

      {/* Chispas/destellos dorados distribuidos.
          Cada chispa es una estrella de 4 puntas tipo brillo de gema. */}
      {[
        { top: "10%", left: "20%", size: 20, op: 0.55 },
        { top: "25%", right: "15%", size: 14, op: 0.45 },
        { top: "60%", left: "8%", size: 24, op: 0.5 },
        { bottom: "20%", right: "28%", size: 14, op: 0.45 },
        { top: "40%", right: "8%", size: 18, op: 0.5 },
        { bottom: "15%", left: "40%", size: 10, op: 0.4 },
        { top: "70%", right: "42%", size: 12, op: 0.4 },
        { top: "15%", left: "50%", size: 10, op: 0.35 },
      ].map((c, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className="absolute"
          style={{
            top: c.top,
            left: c.left,
            right: c.right,
            bottom: c.bottom,
            width: `${c.size}px`,
            height: `${c.size}px`,
            opacity: c.op,
          }}
        >
          <path
            d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z"
            fill={DORADO}
          />
        </svg>
      ))}
    </div>
  );
}