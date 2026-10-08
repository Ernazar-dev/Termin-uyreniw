import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Dropdown, Typography, type MenuProps } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../utils/constants';
import styles from './UserMenu.module.scss';

interface UserMenuProps {
  showName?: boolean;
  /** Guests see only the sign-in button (narrow headers). */
  compact?: boolean;
}

/** Account dropdown for signed-in users, sign-in / register buttons for guests. */
export const UserMenu = ({ showName = true, compact = false }: UserMenuProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.pathname + location.search;

  if (!user) {
    return (
      <div className={styles.authActions}>
        <Link to={ROUTES.login} state={{ from }}><Button>Kiriw</Button></Link>
        {!compact && <Link to={ROUTES.register} state={{ from }}><Button type="primary">Dizimnen ótiw</Button></Link>}
      </div>
    );
  }

  const items: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Shıǵıw',
      danger: true,
      onClick: () => {
        logout();
        navigate(ROUTES.home, { replace: true });
      },
    },
  ];

  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      <button type="button" className={styles.userButton} aria-label="Paydalanıwshı menyusı">
        <Avatar size={32} icon={<UserOutlined />} className={styles.avatar} />
        {showName && (
          <Typography.Text strong ellipsis className={styles.userName}>
            {user.fullName}
          </Typography.Text>
        )}
      </button>
    </Dropdown>
  );
};
