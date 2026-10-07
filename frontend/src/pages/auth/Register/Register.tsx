import { loginRules, normalizeLogin } from '../../../utils/login';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input } from 'antd';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { classesApi } from '../../../api';
import { ClassSelect } from '../../../components';
import { useAuth } from '../../../hooks/useAuth';
import { useRequest } from '../../../hooks/useRequest';
import { AuthLayout } from '../../../layouts/AuthLayout/AuthLayout';
import type { RegisterPayload } from '../../../types/api';
import { ROLE_HOME, ROUTES, TEXT } from '../../../utils/constants';
import { getErrorMessage } from '../../../utils/error';

interface RegisterForm extends RegisterPayload {
  confirmPassword: string;
}

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from;
  const classes = useRequest(() => classesApi.list(), []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async ({ confirmPassword: _confirm, ...values }: RegisterForm) => {
    setSubmitting(true);
    setError(null);
    try {
      const user = await register(values);
      const target = redirectTo?.startsWith(`/${user.role.toLowerCase()}/`) ? redirectTo : ROLE_HOME[user.role];
      navigate(target, { replace: true });
    } catch (registerError) {
      setError(getErrorMessage(registerError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Dizimnen ótiw"
      subtitle="Oqıwshı akkauntın jaratıń"
      footer={
        <>
          Akkauntıńız bar ma? <Link to={ROUTES.login} state={location.state}>Kiriw</Link>
        </>
      }
    >
      {error && <Alert type="error" title={error} showIcon style={{ marginBottom: 16 }} />}
      <Form<RegisterForm> layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        <Form.Item
          label="Tolıq atı"
          name="fullName"
          rules={[
            { required: true, message: TEXT.required },
            { min: 3, message: 'Keminde 3 belgi' },
            { max: 100, message: 'Kóbi menen 100 belgi' },
          ]}
        >
          <Input prefix={<UserOutlined />} placeholder="Atı Familiyası" autoComplete="name" />
        </Form.Item>
        <Form.Item
          label="Kiriw atı"
          name="login"
          normalize={normalizeLogin}
          rules={loginRules}
        >
          <Input prefix={<UserOutlined />} placeholder="Kiriw atı" autoComplete="username" autoCapitalize="none" spellCheck={false} />
        </Form.Item>
        <Form.Item label="Klass" name="classId" rules={[{ required: true, message: 'Klassıńızdı tańlań' }]}>
          <ClassSelect classes={classes.data ?? []} loading={classes.loading} />
        </Form.Item>
        <Form.Item
          label="Parol"
          name="password"
          rules={[
            { required: true, message: TEXT.required },
            { min: 6, message: 'Parol keminde 6 belgi' },
          ]}
        >
          <Input.Password prefix={<LockOutlined />} autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          label="Paroldı tastıyıqlaw"
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: TEXT.required },
            ({ getFieldValue }) => ({
              validator: async (_rule, value) => {
                if (value && value !== getFieldValue('password')) throw new Error('Parollar sáykes emes');
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} autoComplete="new-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block size="large" loading={submitting}>
          Dizimnen ótiw
        </Button>
      </Form>
    </AuthLayout>
  );
};

export default Register;
