// Definicion de las secciones e items del sidebar.
// El filtrado por rol y el flag comingSoon se aplican en el componente.
import {
  BarChart3,
  ClipboardList,
  Coins,
  Gem,
  LayoutDashboard,
  Receipt,
  UserCircle,
  UserCog,
  Users,
  Diamond,
  WeightTilde,
  FileText,
  type LucideIcon,
} from "lucide-react";

// Constantes de roles. Coinciden con los nombres en BD (mayusculas por
// el UppercaseSubscriber del backend). Centralizamos para evitar typos.
export const ROLES = {
  ADMINISTRADOR: "ADMINISTRADOR",
  JEFA: "JEFE DE AGENCIA",
  CAJERO: "CAJERO",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export interface SidebarItem {
  // Etiqueta visible en el sidebar y en tooltip cuando esta colapsado.
  label: string;
  icon: LucideIcon;
  // URL destino. Si es undefined, el item no es clickeable (proximamente).
  href?: string;
  // Roles permitidos. Si es undefined, todos los roles ven el item.
  roles?: Role[];
  // Marca el item como "Proximamente" (modulos no implementados aun).
  comingSoon?: boolean;
  // Numero de sprint en que se implementara. Solo informativo.
  sprint?: number;
}

export interface SidebarSection {
  id: string;
  // Titulo visible solo cuando el sidebar esta expandido.
  title: string;
  items: SidebarItem[];
}

export const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    id: "principal",
    title: "Principal",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
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
      // Catalogos del Sprint 2.
      // Tipos de joya: solo Admin (catalogo administrativo).
      {
        label: "Tipos de Joya",
        icon: Gem,
        href: "/admin/catalogos/tipos-joya",
        roles: [ROLES.ADMINISTRADOR],
      },
      // Kilates: Admin y Jefa, porque la Jefa actualiza precios semanalmente.
      // Internamente esconde botones de alta y desactivar para la Jefa, dejandole solo el de "actualizar precio".
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
      // Visible para los tres roles (Admin, Jefa, Cajero).
      {
        label: "Clientes",
        icon: UserCircle,
        href: "/admin/clientes",
      },
      {
        // Contratos y prestamos: accesible para todos los roles operativos
        label: 'Contratos',
        href: '/admin/contratos',
        icon: FileText,
        roles: [ROLES.ADMINISTRADOR, ROLES.JEFA, ROLES.CAJERO],
      },

      // Joyas todavia es comingSoon: se implementa en Sprint 3 junto con los prestamos, porque las joyas estan ligadas a contratos.
      { label: "Joyas", icon: Diamond, comingSoon: true, sprint: 3 },
      { label: "Préstamos", icon: Coins, comingSoon: true, sprint: 3 },
      { label: "Pagos y Cobros", icon: Receipt, comingSoon: true, sprint: 4 },
    ],
  },
  {
    id: "analitica",
    title: "Análisis",
    items: [
      {
        label: "Reportes",
        icon: BarChart3,
        comingSoon: true,
        sprint: 5,
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