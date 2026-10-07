import { Card, Space, Typography } from 'antd';
import type { TestQuestion as TestQuestionModel } from '../../types/models';
import { AnswerOptions } from '../AnswerOptions/AnswerOptions';

interface TestQuestionProps {
  question: TestQuestionModel;
  index: number;
  total: number;
  selectedId: number | null;
  onSelect: (optionId: number) => void;
}

export const TestQuestion = ({ question, index, total, selectedId, onSelect }: TestQuestionProps) => (
  <Card>
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Text type="secondary">
        Soraw {index + 1} / {total}
      </Typography.Text>
      <Typography.Title level={4} style={{ margin: 0 }}>
        {question.question}
      </Typography.Title>
      <AnswerOptions options={question.options} selectedId={selectedId} onSelect={onSelect} />
    </Space>
  </Card>
);
