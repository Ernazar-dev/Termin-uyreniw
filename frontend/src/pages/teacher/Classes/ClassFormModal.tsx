import { Form, Input } from 'antd';
import { FormModal } from '../../../components/FormModal/FormModal';
import type { ClassPayload } from '../../../types/api';
import type { ClassItem } from '../../../types/models';
import { TEXT } from '../../../utils/constants';

interface ClassFormModalProps {
  open: boolean;
  editing: ClassItem | null;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: ClassPayload) => void;
}

/** The position of a class is assigned automatically, so only the name is asked. */
export const ClassFormModal = ({ open, editing, submitting, onCancel, onSubmit }: ClassFormModalProps) => (
  <FormModal<ClassPayload>
    open={open}
    width={440}
    title={editing ? 'Klassti ózgertiw' : 'Jańa klass'}
    submitting={submitting}
    onCancel={onCancel}
    onSubmit={onSubmit}
    initialValues={editing ? { name: editing.name } : undefined}
  >
    <Form.Item
      label="Klass atı"
      name="name"
      rules={[
        { required: true, message: TEXT.required },
        { max: 50, message: 'Kóbi menen 50 belgi' },
      ]}
    >
      <Input placeholder="Mısalı: 5-klass" autoFocus />
    </Form.Item>
  </FormModal>
);
