import { useState } from 'react';
import { Form, Input, Button, Alert, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const { Title } = Typography;

interface LoginForm {
  userId: string;
  password: string;
}

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const handleSubmit = async (values: LoginForm) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || '로그인에 실패했습니다.');
        return;
      }

      login(data);
      navigate('/');
    } catch {
      setError('서버에 연결할 수 없습니다. 네트워크를 확인하세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.header}>
          <Title level={3} style={{ margin: 0, color: '#1677ff' }}>
            마이빌더 ERP
          </Title>
          <p style={styles.subtitle}>업무 시스템에 로그인하세요</p>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 20 }}
            closable
            onClose={() => setError(null)}
          />
        )}

        <Form layout="vertical" onFinish={handleSubmit} autoComplete="off">
          <Form.Item
            name="userId"
            rules={[{ required: true, message: '사용자 ID를 입력하세요.' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="사용자 ID"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '비밀번호를 입력하세요.' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="비밀번호"
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              로그인
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f0f2f5',
  },
  card: {
    width: 380,
    background: '#fff',
    borderRadius: 8,
    padding: '40px 36px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
  },
  header: {
    textAlign: 'center',
    marginBottom: 28,
  },
  subtitle: {
    color: '#888',
    marginTop: 4,
    marginBottom: 0,
    fontSize: 14,
  },
};
