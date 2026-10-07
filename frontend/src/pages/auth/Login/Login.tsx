import { loginRules, normalizeLogin } from '../../../utils/login';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input } from 'antd';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { AuthLayout } from '../../../layouts/AuthLayout/AuthLayout';
import type { LoginPayload } from '../../../types/api';
import { ROLE_HOME, ROUTES, TEXT } from '../../../utils/constants';
import { getErrorMessage } from '../../../utils/error';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = (location.state as { from?: string } | null)?.from;

  const handleSubmit = async (values: LoginPayload) => {
    setSubmitting(true);
    setError(null);
    try {
      const user = await login(values);
      const target = redirectTo?.startsWith(`/${user.role.toLowerCase()}/`) ? redirectTo : ROLE_HOME[user.role];
      navigate(target, { replace: true });
    } catch (loginError) {
      setError(getErrorMessage(loginError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Kiriw"
      subtitle="Qaytıp kelgenińizden quwanıshlımız!"
      footer={
        <>
          Akkauntıńız joq pa? <Link to={ROUTES.register} state={location.state}>Dizimnen ótiw</Link>
        </>
      }
    >
      {error && <Alert type="error" title={error} showIcon style={{ marginBottom: 16 }} />}
      <Form<LoginPayload> layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        <Form.Item
          label="Kiriw atı"
          name="login"
          normalize={normalizeLogin}
          rules={loginRules}
        >
          <Input prefix={<UserOutlined />} placeholder="Kiriw atı" autoComplete="username" autoCapitalize="none" spellCheck={false} size="large" />
        </Form.Item>
        <Form.Item label="Parol" name="password" rules={[{ required: true, message: TEXT.required }]}>
          <Input.Password prefix={<LockOutlined />} placeholder="••••••" autoComplete="current-password" size="large" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block size="large" loading={submitting}>
          Kiriw
        </Button>
      </Form>
    </AuthLayout>
  );
};

export default Login;
