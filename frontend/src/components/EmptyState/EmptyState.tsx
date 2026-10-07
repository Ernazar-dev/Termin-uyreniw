import { Card, Empty } from 'antd';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  description: ReactNode;
  action?: ReactNode;
  /** Render without a surrounding card (e.g. inside a table or another card). */
  plain?: boolean;
}

export const EmptyState = ({ description, action, plain = false }: EmptyStateProps) => {
  const content = (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={description}>
      {action}
    </Empty>
  );
  return plain ? content : <Card>{content}</Card>;
};
