import { MenuOutlined } from '@ant-design/icons';
import { Button, Drawer, Grid, Layout, Menu, type MenuProps } from 'antd';
import { Suspense, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { PageLoader } from '../../components';
import { ROUTES } from '../../utils/constants';
import { UserMenu } from '../UserMenu/UserMenu';
import logoImg from '../../images/logo.png';
import styles from './DashboardLayout.module.scss';

const { Header, Sider, Content } = Layout;

export interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
  /** Extra path prefixes that should highlight this item (e.g. detail pages). */
  matches?: string[];
}

interface DashboardLayoutProps {
  navItems: NavItem[];
}

export const findActiveKey = (pathname: string, items: NavItem[]) => {
  let best: { key: string; length: number } | null = null;
  for (const item of items) {
    for (const prefix of [item.path, ...(item.matches ?? [])]) {
      if (pathname.startsWith(prefix) && (!best || prefix.length > best.length)) {
        best = { key: item.path, length: prefix.length };
      }
    }
  }
  return best?.key;
};

/** Admin-style layout with side navigation — used by the teacher panel. */
export const DashboardLayout = ({ navItems }: DashboardLayoutProps) => {
  const screens = Grid.useBreakpoint();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [location.pathname]);

  const isDesktop = Boolean(screens.lg);
  const activeKey = findActiveKey(location.pathname, navItems);

  const menuItems = useMemo<MenuProps['items']>(
    () =>
      navItems.map((item) => ({
        key: item.path,
        icon: item.icon,
        label: <Link to={item.path}>{item.label}</Link>,
      })),
    [navItems],
  );

  const navigation = (
    <>
      <Link to={ROUTES.home} className={styles.brand}>
        <img src={logoImg} alt="Logo" className={styles.brandLogo} width={36} height={36} />
        <span className={styles.brandText}>Termin Úyreniw</span>
      </Link>
      <div className={styles.navCaption}>BASQARIW PANELI</div>
      <Menu
        mode="inline"
        theme="dark"
        selectedKeys={activeKey ? [activeKey] : []}
        items={menuItems}
        className={styles.menu}
        onClick={() => setDrawerOpen(false)}
      />
    </>
  );

  return (
    <Layout className={styles.layout}>
      {isDesktop ? (
        <Sider width={248} className={styles.sider} theme="dark">
          {navigation}
        </Sider>
      ) : (
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          size={280}
          styles={{ body: { padding: 0 }, wrapper: { maxWidth: '85vw' } }}
          rootClassName={styles.darkDrawer}
          closable={false}
        >
          {navigation}
        </Drawer>
      )}

      <Layout className={`${styles.main} ${isDesktop ? styles.mainWithSider : ''}`}>
        <Header className={styles.header}>
          {!isDesktop && (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setDrawerOpen(true)}
              aria-label="Menyunı ashıw"
            />
          )}
          <div className={styles.headerExtra}>
            <span className={styles.headerLabel}>{navItems.find((item) => item.path === activeKey)?.label}</span>
          </div>
          <UserMenu showName={Boolean(screens.md)} />
        </Header>

        <Content className={styles.content} ref={contentRef}>
          <Suspense fallback={<PageLoader />}>
            <div key={location.pathname} className={styles.pageEnter}><Outlet /></div>
          </Suspense>
        </Content>
      </Layout>
    </Layout>
  );
};
