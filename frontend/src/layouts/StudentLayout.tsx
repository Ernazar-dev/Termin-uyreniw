import {
  AppstoreOutlined,
  BarChartOutlined,
  CloseOutlined,
  DashboardOutlined,
  FileDoneOutlined,
  LockOutlined,
  MenuOutlined,
  MessageOutlined,
  PlayCircleOutlined,
  ReadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Button, Drawer, Grid, Input, Popover } from 'antd';
import { Suspense, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { PageLoader } from '../components';
import { useActivityEntry } from '../hooks/useActivityEntry';
import { useAuth } from '../hooks/useAuth';
import { ROLES, ROUTES, TEXT } from '../utils/constants';
import { findActiveKey, type NavItem } from './DashboardLayout/DashboardLayout';
import { UserMenu } from './UserMenu/UserMenu';
import logoImg from '../images/logo.png';
import styles from './StudentLayout.module.scss';

interface StudentNavItem extends NavItem {
  /** Visible to guests, but opening it asks to sign in first. */
  requiresAuth?: boolean;
  /** Hidden from guests entirely (personal pages). */
  personal?: boolean;
}

const STUDENT_NAV: StudentNavItem[] = [
  { path: ROUTES.student.dashboard, label: 'Bas panel', icon: <DashboardOutlined />, personal: true },
  { path: ROUTES.student.classes, label: 'Klasslar', icon: <AppstoreOutlined />, matches: ['/student/chapters'] },
  { path: ROUTES.student.terms, label: 'Terminler', icon: <ReadOutlined /> },
  { path: ROUTES.student.games, label: 'Oyınlar', icon: <PlayCircleOutlined /> },
  { path: ROUTES.student.tests, label: 'Testler', icon: <FileDoneOutlined /> },
  { path: ROUTES.student.results, label: 'Nátiyjeler', icon: <BarChartOutlined />, personal: true },
  { path: ROUTES.student.ai, label: 'Aqıllı járdemshi', icon: <MessageOutlined />, requiresAuth: true },
];

/** Global term search — opens the Terms page with the query. */
const HeaderSearch = ({ onSearch, autoFocus }: { onSearch?: () => void; autoFocus?: boolean }) => {
  const navigate = useNavigate();

  return (
    <Input.Search
      placeholder="Termindi izlew..."
      prefix={<SearchOutlined />}
      allowClear
      autoFocus={autoFocus}
      aria-label="Termindi izlew"
      onSearch={(value) => {
        const query = value.trim();
        navigate(query ? `${ROUTES.student.terms}?search=${encodeURIComponent(query)}` : ROUTES.student.terms);
        onSearch?.();
      }}
    />
  );
};

/** Student side of the platform: a top navigation bar instead of the admin-style sidebar. */
export const StudentLayout = () => {
  const { user, initializing } = useAuth();
  const screens = Grid.useBreakpoint();
  const location = useLocation();
  const enterActivity = useActivityEntry();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const contentRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [location.pathname]);

  // Avoid flashing the guest navigation while the stored session is being restored.
  if (initializing) return <PageLoader fullScreen />;

  const isDesktop = Boolean(screens.xl);
  const isStudent = user?.role === ROLES.STUDENT;
  // Personal pages exist only for students; teachers previewing the catalog never see dead links.
  const navItems = STUDENT_NAV
    .filter((item) => (item.personal ? isStudent : !item.requiresAuth || !user || isStudent))
    .map((item) => (!user && item.requiresAuth ? { ...item, icon: <LockOutlined /> } : item));
  const activeKey = findActiveKey(location.pathname, navItems);

  const handleNavClick = (item: StudentNavItem) => (event: MouseEvent) => {
    setDrawerOpen(false);
    if (!user && item.requiresAuth) {
      event.preventDefault();
      enterActivity(item.path, TEXT.aiLoginHint);
    }
  };

  const renderLinks = (className: string) =>
    navItems.map((item) => (
      <Link
        key={item.path}
        to={item.path}
        className={`${className} ${item.path === activeKey ? styles.active : ''}`}
        aria-current={item.path === activeKey ? 'page' : undefined}
        onClick={handleNavClick(item)}
      >
        <span className={styles.linkIcon}>{item.icon}</span>
        {item.label}
      </Link>
    ));

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to={ROUTES.home} className={styles.brand}>
            <img src={logoImg} alt="Logo" className={styles.brandLogo} width={32} height={32} />
            {screens.sm && <span className={styles.brandText}>Termin Úyreniw</span>}
          </Link>

          {isDesktop && <nav className={styles.nav} aria-label="Tiykarǵı menyu">{renderLinks(styles.navLink)}</nav>}

          <div className={styles.headerEnd}>
            {isDesktop && (
              <Popover
                open={searchOpen}
                onOpenChange={setSearchOpen}
                trigger="click"
                placement="bottomRight"
                destroyOnHidden
                content={<div className={styles.searchPopover}><HeaderSearch autoFocus onSearch={() => setSearchOpen(false)} /></div>}
              >
                <Button shape="circle" icon={<SearchOutlined />} aria-label="Termindi izlew" />
              </Popover>
            )}
            <UserMenu showName={Boolean(screens.xxl)} compact={!screens.sm} />
            {!isDesktop && (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setDrawerOpen(true)}
                aria-label="Menyunı ashıw"
              />
            )}
          </div>
        </div>
      </header>

      {!isDesktop && (
        <Drawer
          placement="right"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          size={300}
          closable={false}
          styles={{ body: { padding: 0 } }}
        >
          <div className={styles.drawerHead}>
            <Link to={ROUTES.home} className={styles.brand} onClick={() => setDrawerOpen(false)}>
              <img src={logoImg} alt="Logo" className={styles.brandLogo} width={32} height={32} />
              <span className={styles.brandText}>Termin Úyreniw</span>
            </Link>
            <Button type="text" icon={<CloseOutlined />} onClick={() => setDrawerOpen(false)} aria-label="Jabıw" />
          </div>
          <div className={styles.drawerSearch}>
            <HeaderSearch onSearch={() => setDrawerOpen(false)} />
          </div>
          <nav className={styles.drawerNav} aria-label="Tiykarǵı menyu">{renderLinks(styles.drawerLink)}</nav>
          {!user && !screens.sm && (
            <div className={styles.drawerAuth}>
              <Link to={ROUTES.register} state={{ from: location.pathname + location.search }} onClick={() => setDrawerOpen(false)}>
                <Button type="primary" block>Dizimnen ótiw</Button>
              </Link>
            </div>
          )}
        </Drawer>
      )}

      <main className={styles.content} ref={contentRef}>
        <div className={styles.contentInner}>
          <Suspense fallback={<PageLoader />}>
            <div key={location.pathname} className={styles.pageEnter}><Outlet /></div>
          </Suspense>
        </div>
      </main>
    </div>
  );
};
