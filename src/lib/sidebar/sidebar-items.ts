import {
  BarChart2,
  CalendarDays,
  ClipboardList,
  Coins,
  FileText,
  Gem,
  Landmark,
  LayoutDashboard,
  Receipt,
  RotateCcw,
  UserCircle,
  UserCog,
  Users,
  WeightTilde,
  ArrowLeftRight,
  AlertCircle,
  Bell,
  type LucideIcon,
} from "lucide-react";

export const ROLES = {
  ADMINISTRADOR: "ADMINISTRADOR",
  JEFA: "JEFE DE AGENCIA",
  CAJERO: "CAJERO",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export interface SidebarItem {
  label: string;
  icon: LucideIcon;
  href?: string;
  roles?: Role[];
  comingSoon?: boolean;
  sprint?: number;
}

export interface SidebarSection {
  id: string;
  title: string;
  items: SidebarItem[];
}

export const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    id: "principal",
    title: "Principal",
    items: [
      {
        // Apunta al nuevo dashboard rico con KPIs y gráficos (Sprint 5).
        // Solo Admin y Jefa lo ven; el Cajero va directo a Cobros.
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/admin/dashboard",
        roles: [ROLES.ADMINISTRADOR, ROLES.JEFA],
      },
    ],
  },
  {
    id: "administracion",
    title: "Administración",
    items: [
      {
        label: "Usuarios",
        icon: Users,
        href: "/admin/usuarios",
        roles: [ROLES.ADMINISTRADOR],
      },
      {
        label: "Auditoría",
        icon: ClipboardList,
        href: "/admin/auditoria",
        roles: [ROLES.ADMINISTRADOR, ROLES.JEFA],
      },
      {
        label: "Tipos de Joya",
        icon: Gem,
        href: "/admin/catalogos/tipos-joya",
        roles: [ROLES.ADMINISTRADOR],
      },
      {
        label: "Kilates",
        icon: WeightTilde,
        href: "/admin/catalogos/kilates",
        roles: [ROLES.ADMINISTRADOR, ROLES.JEFA],
      },
    ],
  },
  {
    id: "operaciones",
    title: "Operaciones",
    items: [
      {
        label: "Clientes",
        icon: UserCircle,
        href: "/admin/clientes",
      },
      {
        label: "Contratos",
        icon: Receipt,
        href: "/admin/contratos",
        roles: [ROLES.ADMINISTRADOR, ROLES.JEFA, ROLES.CAJERO],
      },
      {
        label: "Pagos y Cobros",
        icon: Coins,
        href: "/admin/cobros",
      },
      {
        label: "Devoluciones",
        icon: RotateCcw,
        href: "/admin/devoluciones",
      },
      {
        // Dashboard de alertas del Sprint 4: vencimientos y alertas pendientes.
        // Sigue siendo útil para los tres roles como vista operativa rápida.
        label: "Alertas",
        icon: Bell,
        href: "/dashboard",
      },
    ],
  },
  {
    id: "caja",
    title: "Caja",
    items: [
      {
        label: "Caja y Arqueo",
        icon: Landmark,
        href: "/admin/caja",
      },
      {
        label: "Tipo de Cambio",
        icon: ArrowLeftRight,
        href: "/admin/tipo-cambio",
        roles: [ROLES.ADMINISTRADOR, ROLES.JEFA],
      },
      {
        label: "Solicitudes",
        icon: AlertCircle,
        href: "/admin/solicitudes-efectivo",
        roles: [ROLES.ADMINISTRADOR, ROLES.JEFA],
      },
    ],
  },
  {
    id: "reportes",
    title: "Reportes y Analítica",
    items: [
      {
        // No se repite el Dashboard aquí; ya está en Principal.
        label: "Reporte de Contratos",
        icon: FileText,
        href: "/admin/reportes/contratos",
        roles: [ROLES.ADMINISTRADOR, ROLES.JEFA],
      },
      {
        label: "Reporte de Cobros",
        icon: BarChart2,
        href: "/admin/reportes/pagos",
        roles: [ROLES.ADMINISTRADOR, ROLES.JEFA],
      },
      {
        label: "Reporte Diario",
        icon: CalendarDays,
        href: "/admin/reportes/diario",
        roles: [ROLES.ADMINISTRADOR, ROLES.JEFA],
      },
    ],
  },
  {
    id: "cuenta",
    title: "Mi Cuenta",
    items: [{ label: "Mi Perfil", icon: UserCog, href: "/perfil" }],
  },
];