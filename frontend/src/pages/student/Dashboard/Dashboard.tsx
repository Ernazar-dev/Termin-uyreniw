import { AppstoreOutlined, BarChartOutlined, BookOutlined, ReadOutlined } from '@ant-design/icons';
import { Button, Card, Col, Row, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { statsApi } from '../../../api';
import {
  CardsSkeleton,
  EmptyState,
  ErrorState,
  ProgressCard,
  ScoreTag,
  StatCard,
} from '../../../components';
import { useRequest } from '../../../hooks/useRequest';
import styles from '../../../styles/page.module.scss';
import { ROUTES } from '../../../utils/constants';
import { formatDate, formatPercent } from '../../../utils/format';
import { LearningWelcome } from '../../../components/LearningWelcome/LearningWelcome';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useRequest(() => statsApi.student(), []);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !data) {
    return (
      <div className={styles.stack}>
        <CardsSkeleton count={4} />
      </div>
    );
  }

  const { student, counts, lastResult, chapterProgress } = data;

  return (
    <div className={styles.stack}>
      <LearningWelcome />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            label="Klasıń"
            value={student.class?.name ?? '—'}
            icon={<AppstoreOutlined />}
            tone="indigo"
            onClick={student.class ? () => navigate(ROUTES.student.classDetail(student.class!.id)) : undefined}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard label="Baplar" value={counts.chapters} icon={<BookOutlined />} tone="violet" />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            label="Kórilgen terminler"
            value={`${counts.viewedTerms} / ${counts.terms}`}
            icon={<ReadOutlined />}
            tone="teal"
            onClick={() => navigate(ROUTES.student.terms)}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            label="Ortasha test nátiyjesi"
            value={formatPercent(data.averagePercentage)}
            hint={`Tapsırılǵan testler: ${counts.submittedTests}`}
            icon={<BarChartOutlined />}
            tone="amber"
            onClick={() => navigate(ROUTES.student.results)}
          />
        </Col>
      </Row>

      <Card>
        <Typography.Title level={5} className={styles.sectionTitle}>
          Sońǵı tapsırılǵan test
        </Typography.Title>
        {lastResult ? (
          <div className={styles.actions}>
            <div>
              <Typography.Text strong>{lastResult.test.title}</Typography.Text>
              <br />
              <Typography.Text type="secondary">
                {lastResult.test.chapter.title} · {formatDate(lastResult.submittedAt)}
              </Typography.Text>
            </div>
            <div>
              <ScoreTag
                correct={lastResult.correctAnswers}
                total={lastResult.totalQuestions}
                percentage={lastResult.percentage}
              />
              <Button type="link" onClick={() => navigate(ROUTES.student.result(lastResult.id))}>
                Tolıǵıraq
              </Button>
            </div>
          </div>
        ) : (
          <EmptyState
            plain
            description="Siz ele test tapsırmadıńız."
            action={<Button onClick={() => navigate(ROUTES.student.tests)}>Testlerge ótiw</Button>}
          />
        )}
      </Card>

      <section>
        <Typography.Title level={5} className={styles.sectionTitle}>
          Baplar boyınsha progress
        </Typography.Title>
        {chapterProgress.length === 0 ? (
          <EmptyState description="Klasıńız ushın baplar ele qosılmaǵan." />
        ) : (
          <div className={styles.grid}>
            {chapterProgress.map((chapter) => (
              <ProgressCard
                key={chapter.id}
                title={chapter.title}
                description={chapter.description}
                done={chapter.viewedTerms}
                total={chapter.totalTerms}
                caption={`${chapter.viewedTerms} / ${chapter.totalTerms} termin kórildi`}
                footer={
                  <Typography.Text type="secondary">
                    Eń jaqsı test nátiyjesi: {formatPercent(chapter.bestTestPercentage)}
                  </Typography.Text>
                }
                onClick={() => navigate(ROUTES.student.chapter(chapter.id))}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default StudentDashboard;
