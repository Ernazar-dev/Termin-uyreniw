import { ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Result } from 'antd';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState = ({ message, onRetry }: ErrorStateProps) => (
  <Card>
    <Result
      status="warning"
      title="Maǵlıwmattı júklew múmkin bolmadı"
      subTitle={message}
      extra={
        onRetry && (
          <Button icon={<ReloadOutlined />} onClick={onRetry}>
            Qaytadan urınıw
          </Button>
        )
      }
    />
  </Card>
);
