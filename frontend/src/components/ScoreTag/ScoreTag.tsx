import { Tag } from 'antd';
import { formatPercent, getScoreStatus } from '../../utils/format';

interface ScoreTagProps {
  correct: number;
  total: number;
  percentage: number;
}

export const ScoreTag = ({ correct, total, percentage }: ScoreTagProps) => (
  <Tag color={getScoreStatus(percentage)}>
    {correct} / {total} · {formatPercent(percentage)}
  </Tag>
);
