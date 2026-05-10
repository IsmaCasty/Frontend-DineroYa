export interface JoyaCalculoInput {
// ID del tipo de joya (anillo, aro, pulsera, etc.)
idTipoJoya: number;
// ID del kilate (14k, 18k, etc.) que determina precioGramo
idKilate: number;
// Peso total incluyendo piedras y apliques
pesoBruto: number;
// Peso real del oro (pesoBruto menos piedras y apliques)
pesoNeto: number;
// Descripcion libre: color, grabados, danos, marcas
observaciones?: string;
// Si el cajero quiere fijar la tasacion manualmente; si no, el backend calcula
valorTasacion?: number;
}
export interface CalcularPrestamoInput {
joyas: JoyaCalculoInput[];
// Cuanto quiere el cliente (puede ser menor al techo calculado)
montoSolicitado: number;
// 1 = BOB, 2 = USD (segun catalogo de monedas)
idMoneda: number;
// Siempre 30 en la empresa; solo el admin podria cambiarlo
diasPlazo?: number;
}
export interface TramoAplicado {
idTramo: number;
montoDesde: number;
// null en el ultimo tramo (sin limite superior)
montoHasta: number | null;
// Interes legal: siempre 3%
tasaInteres: number;
// Gastos administrativos / custodia: 5.5%, 5.0% o 4.5% segun tramo
tasaGastosAdmin: number;
// Suma de los dos anteriores
tasaTotal: number;
}
export interface JoyaCalculadaResponse {
secJoya: number;
idTipoJoya: number;
tipoJoyaDescripcion: string;
idKilate: number;
// Valor numerico del kilate (18, 14, etc.)
kilateValor: number;
// Precio por gramo neto segun kilate y catalogo vigente
precioGramo: number;
pesoBruto: number;
pesoNeto: number;
observaciones: string | null;
// Parte del prestamo que respalda esta joya
valorPrestamo: number;
// Valor de tasacion (puede superar valorPrestamo; es el techo real)
valorTasacion: number;
}
export interface CalculoPrestamoResponse {
joyas: JoyaCalculadaResponse[];
// Suma de todos los valorPrestamo posibles segun pesoNeto * precioGramo
montoMaximoPrestable: number;
// Lo que el cliente pidio
montoSolicitado: number;
// Siempre en BOB aunque el contrato sea en USD (para calcular el tramo)
montoSolicitadoBOB: number;
// Diferencia entre montoMaximoPrestable y montoSolicitado, en BOB
lineaDisponible: number;
idMoneda: number;
// "BOB" o "USD"
monedaCodigo: string;
// 1 si es BOB; tipo BCB venta si es USD
tasaCambio: number;
tramo: TramoAplicado;
// Componente 1 del interes mensual (3% del capital, proporcional a diasPlazo)
montoInteresPorPlazo: number;
// Componente 2 del interes mensual (gastos admin, proporcional a diasPlazo)
montoGastosAdminPorPlazo: number;
// Suma de los dos: lo que paga el cliente al vencimiento (solo intereses, sin capital)
montoTotalInteresPorPlazo: number;
diasPlazo: number;
// ISO UTC string; usar formatearFechaBolivia para mostrar
fechaDesembolso: string;
// ISO UTC string
fechaVencimiento: string;
}
export type ContratoEstado =
| 'VIGENTE'
| 'CANCELADO'
| 'DEVUELTO'
| 'ADJUDICADO'
| 'ANULADO';
export interface ContratoListadoItem {
id: number;
nroContrato: string;
nroFolio: string | null;
estado: ContratoEstado;
// ISO UTC string
fechaDesembolso: string;
// ISO UTC string; fecha del proximo vencimiento
fechaPago: string;
// Capital original prestado (en la moneda del contrato)
montoPrestamo: number;
// Capital pendiente de pago
saldoCapital: number;
// "BOB" o "USD"
moneda: string;
cliente: {
id: number;
ci: string;
nombreCompleto: string;
};
cajero: {
id: number;
userName: string;
};
cantidadJoyas: number;
// Positivo: dias que faltan para vencer. Negativo: dias de mora.
diasHastaVencimiento: number;
}
export interface ContratosListaResponse {
data: ContratoListadoItem[];
total: number;
pagina: number;
limite: number;
totalPaginas: number;
}
export interface ContratoDetalle {
id: number;
nroContrato: string;
nroFolio: string | null;
// Categoria del contrato (ej: "INICIAL B", segun clasificacion interna)
categoria: string;
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
// ISO UTC strings
fechaDesembolso: string;
fechaPago: string;
diasPlazo: number;
// Interes legal (siempre 3%)
tasaInteres: number;
// Gastos admin segun tramo
tasaGastosAdmin: number;
tasaTotal: number;
// 1 si BOB, tipo BCB venta si USD
tasaCambio: number;
// Capital original
montoPrestamo: number;
// Capital pendiente
saldoCapital: number;
lineaCredito: {
id: number;
// Techo maximo segun joyas valoradas
montoMaximoPrestable: number;
// Cuanto se uso del techo
saldoLineaUsada: number;
// Diferencia disponible para ampliar
lineaDisponible: number;
};
joyas: Array<{
id: number;
secJoya: number;
tipoJoya: { id: number; descripcion: string };
kilate: { id: number; valor: number };
observaciones: string | null;
precioGramo: number;
pesoBruto: number;
pesoNeto: number;
valorPrestamo: number;
valorTasacion: number;
fechaDevolucion: string | null;
}>;
estado: ContratoEstado;
motivoAnulacion: string | null;
observaciones: string | null;
fechaCreacion: string;
fechaActualizacion: string;
}
// Motivos de anulacion permitidos (lista predefinida del negocio)
export type MotivoAnulacion =
| 'ERROR_MONTO'
| 'CLIENTE_INCORRECTO'
| 'DUPLICADO'
| 'OTRO';
export interface AnularContratoInput {
motivo: MotivoAnulacion;
// Solo requerido cuando motivo === 'OTRO'
descripcionOtro?: string;
}
export interface CrearContratoInput {
idCliente: number;
joyas: JoyaCalculoInput[];
montoSolicitado: number;
idMoneda: number;
nroFolio?: string;
diasPlazo?: number;
observaciones?: string;
}