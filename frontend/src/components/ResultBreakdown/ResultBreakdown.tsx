import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import { Card, Col, Progress, Row, Statistic, Tag, Typography } from 'antd';
import type { ResultDetail } from '../../types/models';
import { OPTION_LETTERS } from '../../utils/constants';
import { formatDate, getScoreStatus } from '../../utils/format';
import { COLORS } from '../../styles/theme';
import styles from './ResultBreakdown.module.scss';

const PROGRESS_COLORS = { success: COLORS.success, warning: COLORS.warning, error: COLORS.error } as const;

export const ResultSummary = ({ result }: { result: ResultDetail }) => (
  <Card>
    <Row gutter={[24, 16]} align="middle">
      <Col xs={24} sm={8} className={styles.circle}>
        <Progress
          type="circle"
          percent={Math.round(result.percentage)}
          strokeColor={PROGRESS_COLORS[getScoreStatus(result.percentage)]}
          size={120}
        />
      </Col>
      <Col xs={24} sm={16}>
        <Typography.Title level={4} style={{ marginTop: 0 }}>
          {result.test.title}
        </Typography.Title>
        <Typography.Paragraph type="secondary">
          {result.student.fullName} · {result.test.chapter.class.name} · {result.test.chapter.title} ·{' '}
          {formatDate(result.submittedAt)}
        </Typography.Paragraph>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic title="Nátiyje" value={`${result.correctAnswers} / ${result.totalQuestions}`} />
          </Col>
          <Col span={8}>
            <Statistic title="Durıs" value={result.correctAnswers} styles={{ content: { color: PROGRESS_COLORS.success } }} />
          </Col>
          <Col span={8}>
            <Statistic title="Qáte" value={result.wrongAnswers} styles={{ content: { color: PROGRESS_COLORS.error } }} />
          </Col>
        </Row>
      </Col>
    </Row>
  </Card>
);

/** Per-question review: what the student chose and what was correct. */
export const ResultQuestions = ({ result }: { result: ResultDetail }) => (
  <div className={styles.questions}>
    {result.questions.map((question, index) => (
      <Card key={question.questionId} size="small">
        <div className={styles.questionHead}>
          {question.isCorrect ? (
            <CheckCircleFilled className={styles.iconCorrect} aria-label="Durıs" />
          ) : (
            <CloseCircleFilled className={styles.iconWrong} aria-label="Qáte" />
          )}
          <Typography.Text strong>
            {/* Tests made from a PDF / Word sheet only have numbered questions */}
            {/^d+-soraw$/.test(question.question) ? `${index + 1}-soraw` : `${index + 1}. ${question.question}`}
          </Typography.Text>
        </div>
        <ul className={styles.options}>
          {question.options.map((option, optionIndex) => {
            const isSelected = option.id === question.selectedOptionId;
            const className = option.isCorrect ? styles.correct : isSelected ? styles.wrong : undefined;
            return (
              <li key={option.id} className={className}>
                <span className={styles.letter}>{OPTION_LETTERS[optionIndex]}</span>
                {option.text !== OPTION_LETTERS[optionIndex] && <span className={styles.optionText}>{option.text}</span>}
                {isSelected && <Tag>Tańlanǵan</Tag>}
                {option.isCorrect && <Tag color="success">Durıs juwap</Tag>}
              </li>
            );
          })}
        </ul>
        {question.selectedOptionId === null && <Tag color="default">Juwap berilmegen</Tag>}
      </Card>
    ))}
  </div>
);
