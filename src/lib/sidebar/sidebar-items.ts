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
    ],
  },
  {
    id: "operaciones",
    title: "Operaciones",
    items: [
      { label: "Clientes", icon: UserCircle, comingSoon: true, sprint: 2 },
      { label: "Joyas", icon: Gem, comingSoon: true, sprint: 2 },
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