// Tipos del módulo Reportes y Dashboard.
// Derivados del JSON real de GET /reportes/dashboard (verificado 17/05/2026).

// ─── KPIs ─────────────────────────────────────────────────────────────────────
export interface KpisDto {
  // Contratos
  contratosVigentes: number;
  contratosVencidos: number;
  contratosCanceladosHoy: number;   // cancelados/devueltos HOY (no "vencidosHoy")

  // Cartera
  totalCarteraBob: number;           // saldo capital todo convertido a BOB

  // Cobros
  cobrosHoy: number;                 // cantidad de pagos registrados hoy
  montoCobradoHoy: number;           // monto total cobrado hoy en BOB
  cobradoEsteMes: number;            // acumulado del mes en BOB

  // Alertas
  alertasPendientes: number;
  alertasCriticas: number;

  // Clientes
  clientesActivos: number;
  clientesNuevosEsteMes: number;

  // Joyas
  joyasEnCustodia: number;           // JoyaContrato sin fechaDevolucion
}

// ─── Cobros chart ─────────────────────────────────────────────────────────────
export interface PuntoCobro {
  fecha: string;          // 'YYYY-MM-DD'
  montoTotal: number;     // suma en BOB (un solo monto, no BOB/USD separado)
  cantidadPagos: number;
}

// ─── Distribución de estados ──────────────────────────────────────────────────
export interface DistribucionEstado {
  estado: string;
  cantidad: number;
  porcentaje: number;
}

// ─── Contratos vencidos urgentes ──────────────────────────────────────────────
export interface ContratoVencidoUrgente {
  id: number;
  nroContrato: string;
  clienteNombre: string;
  clienteCi: string;
  diasVencido: number;    // positivo = días vencido; negativo = días restantes
  saldoCapital: number;
  moneda: string;         // 'BOB' o 'USD'
}

// ─── Últimos cobros ───────────────────────────────────────────────────────────
export interface UltimoCobro {
  id: number;
  nroContrato: string;
  clienteNombre: string;
  montoPagado: number;    // campo real del backend
  fechaPago: string;      // 'YYYY-MM-DD HH:mm:ss'
  concepto: string;       // 'AMORTIZACION', 'CANCELACION', 'PAGO_INTERES'
}

// ─── Alertas críticas ─────────────────────────────────────────────────────────
export interface AlertaCritica {
  id: number;
  nroContrato: string;
  clienteNombre: string;
  diasRestantes: number;  // negativo = ya vencido
  montoCapital: number;
  tipoAlerta: string;     // 'VENCIMIENTO_HOY', 'YA_VENCIDO'
}

// ─── Resumen cajeros (solo Admin/Jefa) ────────────────────────────────────────
export interface ResumenCajero {
  idCuenta: number;
  userName: string;
  nombreCompleto: string;
  cobrosHoy: number;
  montoCobradoHoy: number;
  alertasPendientes: number;
}

// ─── Top tipos de joya ────────────────────────────────────────────────────────
export interface TopTipoJoya {
  idTipoJoya: number;
  descripcion: string;
  cantidadContratos: number;
  montoTotalPrestadoBob: number;
}

// ─── Top kilates ──────────────────────────────────────────────────────────────
export interface TopKilate {
  idKilate: number;
  valor: number;          // 14, 18, 21, 24
  cantidadJoyas: number;
  montoTotalPrestadoBob: number;
}

// ─── Respuesta completa del dashboard ─────────────────────────────────────────
export interface DashboardResponse {
  fechaConsulta: string;
  kpis: KpisDto;
  cobrosUltimos30Dias: PuntoCobro[];
  distribucionEstados: DistribucionEstado[];
  contratosVencidosUrgentes: ContratoVencidoUrgente[];
  ultimosCobros: UltimoCobro[];
  alertasCriticasDetalle: AlertaCritica[];
  resumenCajeros: ResumenCajero[];
  topTiposJoya: TopTipoJoya[];
  topKilates: TopKilate[];
}

// ─── Filtros (para hooks de reportes) ────────────────────────────────────────
export interface FiltrosReporteContratos {
  desde?: string;
  hasta?: string;
  estado?: string;
}

export interface FiltrosReportePagos {
  desde?: string;
  hasta?: string;
  idCuentaEmpleado?: number;
}

export interface FiltrosReporteDiario {
  fecha?: string;
}

// ─── Reporte Contratos ────────────────────────────────────────────────────────
export interface ItemReporteContrato {
  id: number;
  nroContrato: string;
  clienteNombre: string;
  clienteCi: string;
  moneda: string;
  montoPrestamo: number | null;
  saldoCapital: number | null;
  tasaInteres: number | null;
  tasaGastosAdmin: number | null;
  diasPlazo: number;
  fechaDesembolso: string;
  fechaPago: string;
  estado: string;
  cajeroNombre: string;
}

export interface ReporteContratosResponse {
  total: number;
  filtros: Record<string, unknown>;
  items: ItemReporteContrato[];
}

// ─── Reporte Pagos ────────────────────────────────────────────────────────────
export interface ItemReportePago {
  id: number;
  nroRecibo: number;
  fechaPago: string;
  clienteNombre: string;
  nroContrato: string;
  tipoOperacion: string;
  monedaPago: string;
  montoInteres: number | null;
  montoGastosAdmin: number | null;
  montoCapital: number | null;
  montoTotal: number | null;
  cajeroNombre: string;
  estado: string;
}

export interface ReportePagosResponse {
  filtros: Record<string, unknown>;
  total: number;
  items: ItemReportePago[];
}

// ─── Reporte Diario ───────────────────────────────────────────────────────────
export interface TotalesDiario {
  contratosNuevos: number;
  montoPrestadoBob: number;
  montoPrestadoUsd: number;
  cobrosCantidad: number;
  montoCobradoBob: number;
  montoCobradoUsd: number;
  devoluciones: number;
}

export interface ResumenCajeroDiario {
  idCuenta: number;
  cajeroNombre: string;
  contratosNuevos: number;
  montoPrestadoBob: number;
  montoPrestadoUsd: number;
  cobrosCantidad: number;
  montoCobradoBob: number;
  montoCobradoUsd: number;
}

export interface ReporteDiarioResponse {
  fecha: string;
  totales: TotalesDiario;
  porCajero: ResumenCajeroDiario[];
}