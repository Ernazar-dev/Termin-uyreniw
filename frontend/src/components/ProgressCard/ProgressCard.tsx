import { RightOutlined } from '@ant-design/icons';
import { Card, Progress, Typography } from 'antd';
import type { ReactNode } from 'react';
import styles from './ProgressCard.module.scss';

interface ProgressCardProps {
  title: string;
  description?: string | null;
  done: number;
  total: number;
  /** Short caption under the progress bar, e.g. "3 / 5 termin úyrenildi". */
  caption: ReactNode;
  footer?: ReactNode;
  onClick?: () => void;
}

export const ProgressCard = ({ title, description, done, total, caption, footer, onClick }: ProgressCardProps) => {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <Card hoverable={Boolean(onClick)} onClick={onClick} className={styles.card}>
      <div className={styles.head}>
        <Typography.Title level={5} className={styles.title}>
          {title}
        </Typography.Title>
        {onClick && <RightOutlined className={styles.arrow} aria-hidden />}
      </div>
      {description && (
        <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }} className={styles.description}>
          {description}
        </Typography.Paragraph>
      )}
      <Progress percent={percent} size="small" />
      <Typography.Text type="secondary" className={styles.caption}>
        {caption}
      </Typography.Text>
      {footer && <div className={styles.footer}>{footer}</div>}
    </Card>
  );
};
