import { Button, Card, Tag, Typography } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { testsApi } from '../../../api';
import { CardsSkeleton, ClassSelect, EmptyState, ErrorState, PageHeader, ScoreTag } from '../../../components';
import { useAuth } from '../../../hooks/useAuth';
import { useActivityEntry } from '../../../hooks/useActivityEntry';
import { useCatalog } from '../../../hooks/useCatalog';
import { useRequest } from '../../../hooks/useRequest';
import styles from '../../../styles/page.module.scss';
import { ROUTES } from '../../../utils/constants';

const StudentTests = () => {
  const { user } = useAuth();
  const enterActivity = useActivityEntry();
  const navigate = useNavigate();
  const [classId, setClassId] = useState<number | undefined>(user?.classId ?? undefined);
  const { classes } = useCatalog();
  const { data, loading, error, reload } = useRequest(() => testsApi.list({ classId }), [classId]);

  return (
    <>
      <PageHeader title="Testler" subtitle="Hár bap sońındaǵı test — nátiyje bahalanadı" />

      <div className={styles.toolbar}>
        <ClassSelect classes={classes} value={classId} onChange={setClassId} allowClear placeholder="Barlıq klasslar" />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading || !data ? (
        <CardsSkeleton count={3} />
      ) : data.length === 0 ? (
        <EmptyState description="Test joq." />
      ) : (
        <div className={styles.grid}>
          {data.map((test) => (
            <Card key={test.id}>
              <Typography.Text type="secondary">
                {test.chapter.class.name} · {test.chapter.title}
              </Typography.Text>
              <Typography.Title level={5} style={{ marginTop: 4 }}>
                {test.title}
              </Typography.Title>
              {test.description && (
                <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }}>
                  {test.description}
                </Typography.Paragraph>
              )}
              <div className={styles.actions} style={{ alignItems: 'center' }}>
                <div>
                  <Tag>{test._count.questions} soraw</Tag>
                  {test.hasFile && <Tag color="red">Fayl</Tag>}
                  {test.lastResult && (
                    <ScoreTag
                      correct={test.lastResult.correctAnswers}
                      total={test.lastResult.totalQuestions}
                      percentage={test.lastResult.percentage}
                    />
                  )}
                </div>
                <Button
                  type={test.lastResult ? 'default' : 'primary'}
                  disabled={test._count.questions === 0}
                  onClick={() => {
                    if (!user) {
                      enterActivity(
                        ROUTES.student.test(test.id),
                        'Testti baslaw hám nátiyjeńizdi saqlaw ushın akkauntıńızǵa kiriń.',
                      );
                      return;
                    }
                    navigate(ROUTES.student.test(test.id));
                  }}
                >
                  {test.lastResult ? 'Qayta tapsırıw' : 'Baslaw'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
};

export default StudentTests;
