// Tipos del módulo Pagos, Cobros y Devoluciones (M4 - Sprint 4).
// Reflejan exactamente los DTOs que devuelve el backend.

// ===== TIPO DE CAMBIO =====
// Lo que devuelve GET /pagos/tipo-cambio/vigente (y también /hoy para compatibilidad)
export interface TipoCambioHoy {
  id: number;
  idMoneda: number;
  fechaCambio: string;
  compraBCB: number;
  ventaBCB: number;
  ventaPublico: number;
  // true = ya se usó en un pago del día, no puede modificarse.
  yaUsadoEnPago: boolean;
  estado: string;
  // true = el TC es del día de hoy (Bolivia). false = es de un día anterior.
  // Solo lo devuelve el endpoint /vigente; en /hoy siempre es implícitamente true.
  esDeHoy: boolean;
}

// Lo que devuelve GET /pagos/tipo-cambio (historial paginado)
export interface TipoCambioItem {
id: number;
fechaCambio: string;
compraBCB: number;
ventaBCB: number;
ventaPublico: number;
estado: string;
}
export interface TipoCambioListaResponse {
  datos: TipoCambioItem[];   // era 'data', el backend devuelve 'datos'
  total: number;
  pagina: number;
  limite: number;
}
// Body de POST /pagos/tipo-cambio
export interface CrearTipoCambioInput {
compraBCB: number;
ventaBCB: number;
ventaPublico: number;
}

// ===== CALCULAR PREVIEW (sin persistir) =====
// Body de POST /pagos/calcular
export interface CalcularPagoInput {
idContrato: number;
// 0 o ausente = solo interés (renovación). Positivo = amortización parcial. Igual al saldo = cancelación total.
montoCapital: number;
monedaPago: 'BOB' | 'USD';
}
// Respuesta de POST /pagos/calcular (mismos campos que POST /pagos, sin persistir)
export interface CalcularPagoResponse {
  tipoOperacion: 'PAGO_INTERES' | 'AMORTIZACION' | 'CANCELACION';
  montoInteres: number;
  montoGastosAdmin: number;
  montoCapital: number;
  montoDescuento: number;
  montoTotal: number;
  montoEquivalente: number;
  monedaPago: string;
  tasaCambio: number;
  saldoCapitalAntes: number;
  saldoCapitalDespues: number;
  nuevaFechaVencimiento: string | null;
  diasTranscurridos: number;
}

// ===== PAGOS =====
// Body de POST /pagos (crear pago)
export interface CrearPagoInput {
idContrato: number;
montoCapital: number;
monedaPago: 'BOB' | 'USD';
}
// Respuesta de POST /pagos y GET /pagos/:id
export interface PagoResponse {
  id: number;
  nroRecibo: number;
  nroContrato: string;
  secPagoContrato: number;
  tipoOperacion: string;
  montoTotal: number;
  montoInteres: number;
  montoGastosAdmin: number;
  montoCapital: number;
  montoDescuento: number;
  monedaPago: string;
  tasaCambio: number;
  montoEquivalente: number;
  saldoCapitalAntes: number;
  saldoCapitalDespues: number;
  estado: string;
  estadoContrato: string;
  esNuevo: boolean;
  nuevaFechaPago: string | null;
  fechaPago: string;
}
// Ítem en la lista de pagos (GET /pagos paginado)
export interface PagoListadoItem {
  idPago: number;
  nroRecibo: number;
  nroContrato: string;
  clienteNombre: string;
  clienteCi: string;
  tipoOperacion: string;
  montoTotal: number;
  montoInteres: number;
  montoGastosAdmin: number;
  montoCapital: number;
  monedaPago: string;
  tasaCambio: number;
  saldoCapitalDespues: number;
  estado: string;
  motivoAnulacion: string | null;
  cajeroNombre: string;
  fechaCreacion: string;
}

export interface PagosListaResponse {
  data: PagoListadoItem[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}
// Body de POST /pagos/:id/anular
export interface AnularPagoInput {
motivo: string; // Lista predefinida: 'ERROR_MONTO', 'CLIENTE_INCORRECTO', 'DUPLICADO', 'OTRO'
descripcion?: string; // Requerido si motivo = 'OTRO'
}
// ===== ALERTAS =====
// Respuesta de GET /pagos/alertas/dashboard
export interface AlertaDashboardResponse {
vencidosTotal: number;
vencidoHoy: number;
proximos1Dia: number;
proximos7Dias: number;
proximos15Dias: number;
proximos30Dias: number;
alertasNoAtendidas: number;
contratosUrgentes: ContratoUrgente[];
}
// Contrato urgente dentro del dashboard de alertas
export interface ContratoUrgente {
idContrato: number;
nroContrato: string;
clienteNombre: string;
clienteTelefono: string | null;
fechaVencimiento: string; // YYYY-MM-DD
saldoCapital: number;
// Negativo = ya venció (días de mora). Positivo = días restantes.
diasHastaVencimiento: number;
}
// Ítem en la lista de alertas (GET /pagos/alertas paginado)
export interface AlertaItem {
id: number;
idContrato: number;
nroContrato: string;
clienteNombre: string;
tipo: string; // 'VENCIMIENTO', 'RECORDATORIO'
canal: string; // 'WHATSAPP', 'SMS', 'DASHBOARD'
mensaje: string;
estado: string; // 'PENDIENTE', 'ENVIADA', 'ATENDIDA', 'FALLIDA'
fechaProgramada: string;
fechaEnvio: string | null;
atendidaPor: string | null;
fechaAtendida: string | null;
notaAtencion: string | null;
}
export interface AlertasListaResponse {
data: AlertaItem[];
total: number;
pagina: number;
porPagina: number;
}
// Body de PATCH /pagos/alertas/:id/atender
export interface AtenderAlertaInput {
nota?: string;
}
// ===== DEVOLUCIÓN DE JOYAS =====
// Body de POST /pagos/devoluciones
export interface CrearDevolucionInput {
idContrato: number;
observaciones?: string;
}
// Respuesta de POST /pagos/devoluciones
export interface DevolucionResponse {
nroDevolucion: number;
nroContrato: string;
clienteNombre: string;
clienteCI: string;
agenciaNombre: string;
cajeroNombre: string;
montoPrestamo: number;
fechaDevolucion: string;
joyas: JoyaDevuelta[];
}
export interface JoyaDevuelta {
tipoJoya: string;
kilate: number;
pesoBruto: number;
pesoNeto: number;
observaciones: string;
valorPrestamo: number;
valorTasacion: number;
}
// ===== CAJA =====
// Sprint 5: las 10 columnas BOB/USD reemplazaron los campos globales anteriores.
// Los campos legacy (montoInicialCaja, totalPrestado, etc.) siguen en BD como 0
// en registros nuevos, por eso se mantienen como opcionales aquí.
export interface CajaArqueo {
  id: number;
  idCuentaEmpleado: number;
  estado: 'ABIERTO' | 'CERRADO'; 
  fechaApertura: string;
  fechaCierre: string | null;
  // Nuevas columnas Sprint 5 (separadas por moneda)
  montoInicialCajaBob: number;
  montoInicialCajaUsd: number;
  totalPrestadoBob: number;
  totalPrestadoUsd: number;
  totalCobradoBob: number;
  totalCobradoUsd: number;
  montoReportadoBob: number;
  montoReportadoUsd: number;
  diferenciaBob: number;
  diferenciaUsd: number;
}

export interface ArqueoResponse {
  cajas: CajaArqueo[];
  // Totales consolidados BOB/USD
  totalPrestadoBobGlobal: number;
  totalPrestadoUsdGlobal: number;
  totalCobradoBobGlobal: number;
  totalCobradoUsdGlobal: number;
}

// Sprint 5: el monto ya no lo ingresa el usuario.
// El backend lo toma del último cierre via el endpoint sugerido.
export interface AbrirCajaInput {
  idCuentaEmpleadoTarget: number;
}

// BOB y USD separados en lugar de un solo montoReportadoCajero.
export interface CerrarCajaInput {
  idCuentaEmpleadoTarget: number;
  montoReportadoBob: number;
  montoReportadoUsd: number;
  observaciones?: string;
}

export interface MontoSugeridoResponse {
  montoBob: number;
  montoUsd: number;
}

// Solicitudes de efectivo
export interface SolicitudEfectivoInput {
montoSolicitado: number;
motivo: string;
}
// Body de PATCH /pagos/caja/solicitud-efectivo/:id
export interface GestionarSolicitudInput {
accion: 'APROBAR' | 'RECHAZAR';
observacion?: string;
}
export interface SolicitudEfectivoItem {
id: number;
montoSolicitado: number;
motivo: string;
estado: string; // 'PENDIENTE', 'APROBADA', 'RECHAZADA'
observacion: string | null;
solicitanteNombre: string;
fechaSolicitud: string;
fechaRespuesta: string | null;
}
// Body de POST /pagos/caja/traspaso
export interface TraspasoCajaInput {
montoTraspaso: number;
motivo: string;
}

// ===== TIPOS PARA EL FLUJO DE COBROS =====
// Estos tipos son específicos del flujo de registro de pagos.
// Se separan de los tipos generales de contratos porque el contexto
// de cobros necesita datos específicos de forma compacta.

// Ítem que aparece en los resultados de búsqueda de contrato (cobros)
// Coincide exactamente con ContratoListadoItemDto del backend.
export interface ContratoBusquedaItem {
  id: number;
  nroContrato: string;
  estado: string;
  fechaPago: string;       // ISO date string del vencimiento actual
  montoPrestamo: number;
  saldoCapital: number;
  moneda: string;          // 'BOB' | 'USD' - campo plano en el backend
  cliente: {
    id: number;
    ci: string;
    nombreCompleto: string;
  };
  cantidadJoyas: number;   // backend usa cantidadJoyas, no nroJoyas
  diasHastaVencimiento: number;
}

export interface ContratosBusquedaResponse {
  data: ContratoBusquedaItem[];
  total: number;
  pagina: number;
  limite: number;          // backend usa 'limite', no 'porPagina'
  totalPaginas: number;
}

// Detalle completo del contrato necesario para registrar el pago.
// Se obtiene de GET /contratos/:id después de seleccionar el contrato.
// Detalle completo del contrato para cobros y devoluciones.
// Coincide exactamente con ContratoResponseDto del backend.
export interface ContratoParaPago {
  id: number;
  nroContrato: string;
  nroFolio: string | null;
  categoria: string;
  // El backend devuelve objetos anidados, no campos planos.
  cliente: {
    id: number;
    ci: string;
    nombreCompleto: string;
    telefono: string | null;
  };
  cajero: {
    id: number;
    userName: string;
    nombreCompleto: string;
  };
  agencia: {
    id: number;
    codigoAgencia: string;
    nombre: string;
  };
  moneda: {
    id: number;
    codigoIso: string;
    descripcion: string;
  };
  fechaDesembolso: string;
  fechaPago: string;
  diasPlazo: number;
  tasaInteres: number;
  tasaGastosAdmin: number;
  tasaTotal: number;
  tasaCambio: number;
  montoPrestamo: number;
  saldoCapital: number;
  lineaCredito: {
    id: number;
    montoMaximoPrestable: number;
    saldoLineaUsada: number;
    lineaDisponible: number;
  };
  joyas: JoyaContratoPago[];
  estado: string;
  motivoAnulacion: string | null;
  observaciones: string | null;
}

export interface JoyaContratoPago {
  id: number;
  secJoya: number;
  tipoJoya: {
    id: number;
    descripcion: string;
  };
  // El backend devuelve kilate como objeto { id, valor }, no como número directo.
  kilate: {
    id: number;
    valor: number;
  };
  pesoBruto: number;
  pesoNeto: number;
  precioGramo: number;
  valorPrestamo: number;
  valorTasacion: number;
  observaciones: string | null;
  fechaDevolucion: string | null;
}