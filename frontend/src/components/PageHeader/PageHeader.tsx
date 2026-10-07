import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Typography } from 'antd';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { TEXT } from '../../utils/constants';
import styles from './PageHeader.module.scss';

type Tone = 'indigo' | 'amber' | 'teal' | 'pink' | 'violet';

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Path to go back to; `true` uses browser history. */
  back?: string | boolean;
  extra?: ReactNode;
  /** Optional coloured icon chip in front of the title (used by the admin pages). */
  icon?: ReactNode;
  tone?: Tone;
}

export const PageHeader = ({ title, subtitle, back, extra, icon, tone = 'indigo' }: PageHeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (typeof back === 'string') navigate(back);
    else navigate(-1);
  };

  return (
    <header className={`${styles.header} ${icon ? styles.banner : ''} ${styles[tone]}`}>
      <div className={styles.main}>
        {back && (
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleBack} aria-label={TEXT.back} />
        )}
        {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
        <div className={styles.texts}>
          <Typography.Title level={3} className={styles.title}>
            {title}
          </Typography.Title>
          {subtitle && <Typography.Text type="secondary">{subtitle}</Typography.Text>}
        </div>
      </div>
      {extra && <div className={styles.extra}>{extra}</div>}
    </header>
  );
};
