import { Col, Form, Input, Row } from 'antd';
import { ClassSelect } from '../../../components';
import { FormModal } from '../../../components/FormModal/FormModal';
import type { StudentPayload } from '../../../types/api';
import type { ClassItem, Student } from '../../../types/models';
import { TEXT } from '../../../utils/constants';
import { loginRules, normalizeLogin } from '../../../utils/login';

interface StudentFormModalProps {
  open: boolean;
  editing: Student | null;
  classes: ClassItem[];
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: StudentPayload) => void;
}

export const StudentFormModal = ({
  open,
  editing,
  classes,
  submitting,
  onCancel,
  onSubmit,
}: StudentFormModalProps) => (
  <FormModal<StudentPayload>
    open={open}
    title={editing ? 'Oqıwshını ózgertiw' : 'Jańa oqıwshı'}
    submitting={submitting}
    onCancel={onCancel}
    onSubmit={onSubmit}
    width={620}
    initialValues={
      editing ? { fullName: editing.fullName, login: editing.login, classId: editing.classId ?? undefined } : undefined
    }
  >
    <Row gutter={16}>
      <Col xs={24} sm={12}>
        <Form.Item
          label="Tolıq atı"
          name="fullName"
          rules={[
            { required: true, message: TEXT.required },
            { min: 3, message: 'Keminde 3 belgi' },
            { max: 100, message: 'Kóbi menen 100 belgi' },
          ]}
        >
          <Input autoFocus />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item label="Kiriw atı" name="login" normalize={normalizeLogin} rules={loginRules}>
          <Input placeholder="Kiriw atı" autoComplete="username" autoCapitalize="none" spellCheck={false} />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item label="Klass" name="classId" rules={[{ required: true, message: TEXT.required }]}>
          <ClassSelect classes={classes} />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          label="Parol"
          name="password"
          extra={editing ? 'Ózgertpew ushın bos qaldırıń' : undefined}
          rules={[
            { required: !editing, message: TEXT.required },
            { min: 6, message: 'Parol keminde 6 belgi' },
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
      </Col>
    </Row>
  </FormModal>
);
