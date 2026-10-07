import { Card, Typography } from 'antd';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import logoImg from '../../images/logo.png';
import styles from './AuthLayout.module.scss';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export const AuthLayout = ({ title, subtitle, children, footer }: AuthLayoutProps) => (
  <main className={styles.page}>
    <div className={styles.wrapper}>
      <Link to={ROUTES.home} className={styles.brand}>
        <img src={logoImg} alt="Logo" className={styles.brandLogo} width={44} height={44} />
        <span>Termin Úyreniw</span>
      </Link>
      <Card className={styles.card}>
        <div className={styles.header}>
          <Typography.Title level={3} className={styles.title}>
            {title}
          </Typography.Title>
          {subtitle && <Typography.Paragraph type="secondary">{subtitle}</Typography.Paragraph>}
        </div>
        {children}
      </Card>
      {footer && <div className={styles.footer}>{footer}</div>}
      <Link to={ROUTES.home} className={styles.back}>← Akkauntsız dawam etiw</Link>
    </div>
  </main>
);
