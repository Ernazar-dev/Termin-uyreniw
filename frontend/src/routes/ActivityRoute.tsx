import { LockOutlined } from '@ant-design/icons';
import { Button, Card, Space, Typography } from 'antd';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { PageLoader } from '../components';
import { useAuth } from '../hooks/useAuth';
import { COLORS } from '../styles/theme';
import { ROUTES } from '../utils/constants';

interface ActivityRouteProps {
  description?: string;
  backTo?: string;
  backLabel?: string;
}

/** Direct activity links also offer sign-in in place instead of unexpectedly redirecting. */
export const ActivityRoute = ({
  description = 'Testlerdiń dizimin akkauntsız kóriw múmkin. Testti baslaw hám nátiyjeńizdi saqlaw ushın akkauntıńızǵa kiriń.',
  backTo = ROUTES.student.tests,
  backLabel = 'Dizimge qaytıw',
}: ActivityRouteProps) => {
  const { user, initializing } = useAuth();
  const location = useLocation();
  if (initializing) return <PageLoader />;
  if (user) return <Outlet />;
  const from = location.pathname + location.search;
  return (
    <Card style={{ maxWidth: 560, margin: '48px auto', textAlign: 'center' }}>
      <LockOutlined style={{ fontSize: 32, color: COLORS.primary, marginBottom: 12 }} />
      <Typography.Title level={3}>Akkauntqa kiriń</Typography.Title>
      <Typography.Paragraph type="secondary">{description}</Typography.Paragraph>
      <Space wrap style={{ justifyContent: 'center' }}>
        <Link to={ROUTES.login} state={{ from }}><Button type="primary">Kiriw</Button></Link>
        <Link to={ROUTES.register} state={{ from }}><Button>Dizimnen ótiw</Button></Link>
        <Link to={backTo}><Button type="text">{backLabel}</Button></Link>
      </Space>
    </Card>
  );
};
