import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Space, Tooltip } from 'antd';
import type { ReactNode } from 'react';
import { TEXT } from '../../utils/constants';

interface TableActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  extra?: ReactNode;
}

export const TableActions = ({ onEdit, onDelete, extra }: TableActionsProps) => (
  <Space size={4} onClick={(event) => event.stopPropagation()}>
    {extra}
    {onEdit && (
      <Tooltip title={TEXT.edit}>
        <Button type="text" icon={<EditOutlined />} onClick={onEdit} aria-label={TEXT.edit} />
      </Tooltip>
    )}
    {onDelete && (
      <Tooltip title={TEXT.delete}>
        <Button type="text" danger icon={<DeleteOutlined />} onClick={onDelete} aria-label={TEXT.delete} />
      </Tooltip>
    )}
  </Space>
);
