import { ArrowRightOutlined } from '@ant-design/icons';
import { Card, Typography } from 'antd';
import type { ReactNode } from 'react';
import styles from './StatCard.module.scss';

export type StatTone = 'indigo' | 'amber' | 'teal' | 'pink' | 'violet' | 'green';

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  hint?: ReactNode;
  tone?: StatTone;
  onClick?: () => void;
}

export const StatCard = ({ label, value, icon, hint, tone = 'indigo', onClick }: StatCardProps) => (
  <Card hoverable={Boolean(onClick)} onClick={onClick} className={`${styles.card} ${styles[tone]}`}>
    <div className={styles.body}>
      <span className={styles.icon} aria-hidden>
        {icon}
      </span>
      <div className={styles.texts}>
        <Typography.Text type="secondary" className={styles.label}>
          {label}
        </Typography.Text>
        <div className={styles.value}>{value}</div>
        {hint && (
          <Typography.Text type="secondary" className={styles.hint}>
            {hint}
          </Typography.Text>
        )}
      </div>
      {onClick && <ArrowRightOutlined className={styles.arrow} aria-hidden />}
    </div>
  </Card>
);
