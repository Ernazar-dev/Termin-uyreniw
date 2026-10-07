import { App } from 'antd';
import { useCallback, useState } from 'react';
import { TEXT } from '../utils/constants';
import { getErrorMessage } from '../utils/error';

interface SubmitOptions {
  /** Keep the modal open after saving (for "save and add next"). */
  keepOpen?: boolean;
}

/**
 * State for a create/edit modal: which record is edited, whether it is open
 * and a `submit` wrapper that shows loading + success/error messages.
 * `submit` resolves to `true` when the record was saved.
 */
export const useModalForm = <T>() => {
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const openCreate = useCallback(() => {
    setEditing(null);
    setOpen(true);
  }, []);

  const openEdit = useCallback((record: T) => {
    setEditing(record);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setEditing(null);
  }, []);

  const submit = useCallback(
    async (action: () => Promise<unknown>, onSuccess?: () => void, options?: SubmitOptions) => {
      setSubmitting(true);
      try {
        await action();
        message.success(TEXT.saved);
        if (!options?.keepOpen) close();
        onSuccess?.();
        return true;
      } catch (error) {
        message.error(getErrorMessage(error));
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [close, message],
  );

  return { open, editing, submitting, openCreate, openEdit, close, submit };
};
