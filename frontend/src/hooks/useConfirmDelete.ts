import { App } from 'antd';
import { useCallback } from 'react';
import { TEXT } from '../utils/constants';
import { getErrorMessage } from '../utils/error';

interface ConfirmDeleteOptions {
  title?: string;
  content?: string;
  onDelete: () => Promise<unknown>;
  onSuccess?: () => void;
}

/** Ant Design confirm dialog + API call + success/error message in one place. */
export const useConfirmDelete = () => {
  const { modal, message } = App.useApp();

  return useCallback(
    ({ title = TEXT.confirmDelete, content = TEXT.confirmDeleteHint, onDelete, onSuccess }: ConfirmDeleteOptions) => {
      modal.confirm({
        title,
        content,
        okText: TEXT.delete,
        cancelText: TEXT.cancel,
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await onDelete();
            message.success(TEXT.deleted);
            onSuccess?.();
          } catch (error) {
            message.error(getErrorMessage(error));
          }
        },
      });
    },
    [modal, message],
  );
};
