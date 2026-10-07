import {
  AppstoreOutlined,
  BarChartOutlined,
  BookOutlined,
  DashboardOutlined,
  FileDoneOutlined,
  PlayCircleOutlined,
  ReadOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { ROUTES } from '../utils/constants';
import { DashboardLayout, type NavItem } from './DashboardLayout/DashboardLayout';

const TEACHER_NAV: NavItem[] = [
  { path: ROUTES.teacher.dashboard, label: 'Bas panel', icon: <DashboardOutlined /> },
  { path: ROUTES.teacher.classes, label: 'Klasslar', icon: <AppstoreOutlined /> },
  { path: ROUTES.teacher.chapters, label: 'Baplar', icon: <BookOutlined /> },
  { path: ROUTES.teacher.terms, label: 'Terminler', icon: <ReadOutlined /> },
  { path: ROUTES.teacher.games, label: 'Oyınlar', icon: <PlayCircleOutlined /> },
  { path: ROUTES.teacher.tests, label: 'Testler', icon: <FileDoneOutlined /> },
  { path: ROUTES.teacher.students, label: 'Oqıwshılar', icon: <TeamOutlined /> },
  { path: ROUTES.teacher.results, label: 'Nátiyjeler', icon: <BarChartOutlined /> },
];

export const TeacherLayout = () => <DashboardLayout navItems={TEACHER_NAV} />;
