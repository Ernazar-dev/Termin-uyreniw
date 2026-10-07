import { Card, Skeleton, Spin } from 'antd';
import styles from './Loading.module.scss';

export const PageLoader = ({ fullScreen = false }: { fullScreen?: boolean }) => (
  <div className={fullScreen ? styles.fullScreen : styles.page} role="status" aria-live="polite">
    <Spin size="large" />
  </div>
);

export const CardsSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className={styles.grid} aria-busy="true">
    {Array.from({ length: count }, (_, index) => (
      <Card key={index}>
        <Skeleton active paragraph={{ rows: 3 }} />
      </Card>
    ))}
  </div>
);

export const ContentSkeleton = ({ rows = 6 }: { rows?: number }) => (
  <Card aria-busy="true">
    <Skeleton active paragraph={{ rows }} />
  </Card>
);
