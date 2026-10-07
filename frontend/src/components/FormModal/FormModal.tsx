import { Button, Form, Modal, Space, type FormInstance } from 'antd';
import { useEffect, useRef, type ReactNode } from 'react';
import { TEXT } from '../../utils/constants';

interface FormModalProps<T> {
  open: boolean;
  title: string;
  submitting: boolean;
  onCancel: () => void;
  /** `again` is true when the user pressed the "save and add next" button. */
  onSubmit: (values: T, again: boolean) => void | Promise<unknown>;
  initialValues?: Partial<T>;
  width?: number;
  children: ReactNode;
  /** Shows a secondary button that saves and keeps the modal open for the next record. */
  continueText?: string;
  /** Changing this remounts the form, so `initialValues` are applied again (used after "save and add next"). */
  resetKey?: number;
  /** Small hint on the left of the footer, e.g. how many records were added in this session. */
  footerNote?: ReactNode;
}

/**
 * The form instance outlives the modal content, so values left over from the previous session
 * are dropped as soon as the (freshly mounted) form is connected.
 */
const ResetOnMount = ({ form }: { form: FormInstance }) => {
  useEffect(() => {
    form.resetFields();
  }, [form]);
  return null;
};

/**
 * Modal + vertical Form. The modal never grows past the viewport: the body scrolls
 * while the title and the buttons stay in place (see global.scss). The content is destroyed
 * on close and the form is reset whenever it opens, so `initialValues` always apply fresh.
 * (Not `preserve={false}`: it wipes values of Form.List items when React StrictMode remounts them.)
 */
export const FormModal = <T extends object>({
  open,
  title,
  submitting,
  onCancel,
  onSubmit,
  initialValues,
  width = 560,
  children,
  continueText,
  resetKey,
  footerNote,
}: FormModalProps<T>) => {
  const [form] = Form.useForm<T>();
  const again = useRef(false);

  const submit = (next: boolean) => {
    again.current = next;
    form.submit();
  };

  return (
    <Modal
      open={open}
      title={title}
      onCancel={onCancel}
      centered
      destroyOnHidden
      mask={{ closable: false }}
      width={width}
      footer={
        <div className="modal-footer-row">
          <span className="modal-footer-note">{footerNote}</span>
          <Space wrap>
            <Button onClick={onCancel}>{TEXT.cancel}</Button>
            {continueText && (
              <Button disabled={submitting} onClick={() => submit(true)}>
                {continueText}
              </Button>
            )}
            <Button type="primary" loading={submitting} onClick={() => submit(false)}>
              {TEXT.save}
            </Button>
          </Space>
        </div>
      }
    >
      <Form<T>
        key={resetKey}
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={(values) => onSubmit(values, again.current)}
        scrollToFirstError
      >
        <ResetOnMount form={form} />
        {children}
      </Form>
    </Modal>
  );
};
