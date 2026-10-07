import { FileDoneOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { Button, Card, Pagination, Steps, Typography } from 'antd';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { chaptersApi, termsApi } from '../../../api';
import { CardsSkeleton, ContentSkeleton, EmptyState, ErrorState, PageHeader, TermCard } from '../../../components';
import { useRequest } from '../../../hooks/useRequest';
import { useAuth } from '../../../hooks/useAuth';
import { useActivityEntry } from '../../../hooks/useActivityEntry';
import styles from '../../../styles/page.module.scss';
import { ROUTES } from '../../../utils/constants';

const TERMS_PAGE_SIZE = 24;

const ChapterContent = ({ id }: { id: number }) => {
  const { user } = useAuth();
  const enterActivity = useActivityEntry();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const chapter = useRequest(() => chaptersApi.get(id), [id]);
  const terms = useRequest(() => termsApi.list({ chapterId: id, page, pageSize: TERMS_PAGE_SIZE }), [id, page]);

  if (chapter.error) return <ErrorState message={chapter.error} onRetry={chapter.reload} />;
  if (chapter.loading || !chapter.data) return <ContentSkeleton />;

  const data = chapter.data;
  const hasGames = data._count.games > 0;

  return (
    <div className={styles.stack}>
      <PageHeader
        title={data.title}
        subtitle={`${data.class.name} · ${data.startTopic}–${data.endTopic}-temalar`}
        back={ROUTES.student.classDetail(data.classId)}
      />

      <Card>
        {data.description && <Typography.Paragraph>{data.description}</Typography.Paragraph>}
        <Steps
          size="small"
          responsive
          current={0}
          items={[
            { title: 'Terminler', content: `${data._count.terms} termin` },
            { title: 'Interaktiv shınıǵıwlar', content: `${data._count.games} shınıǵıw` },
            { title: 'Test', content: `${data._count.tests} test` },
          ]}
        />
      </Card>

      <section>
        <Typography.Title level={5} className={styles.sectionTitle}>
          Terminler
        </Typography.Title>
        {terms.error ? (
          <ErrorState message={terms.error} onRetry={terms.reload} />
        ) : terms.loading || !terms.data ? (
          <CardsSkeleton count={3} />
        ) : terms.data.items.length === 0 ? (
          <EmptyState description="Házirge shekem termin qosılmaǵan." />
        ) : (
          <>
          <div className={styles.grid}>
            {terms.data.items.map((term) => (
              <TermCard key={term.id} term={term} onClick={() => navigate(ROUTES.student.term(term.id))} />
            ))}
          </div>
          <Pagination responsive showLessItems style={{ marginTop: 24 }} current={page} pageSize={TERMS_PAGE_SIZE}
            total={terms.data.total} onChange={setPage} showSizeChanger={false} hideOnSinglePage />
          </>
        )}
      </section>

      <Card>
        <Typography.Title level={5} className={styles.sectionTitle}>
          Bilimdi bekkemlew
        </Typography.Title>
        <div className={styles.stackSm}>
          <div className={styles.actions}>
            <Typography.Text>Interaktiv shınıǵıwlar</Typography.Text>
            <Button
              icon={<PlayCircleOutlined />}
              disabled={!hasGames}
              onClick={() => navigate(ROUTES.student.gamePlay(data.id))}
            >
              {hasGames ? 'Baslaw' : 'Oyın qosılmaǵan'}
            </Button>
          </div>
          {data.tests.length === 0 ? (
            <Typography.Text type="secondary">Test joq.</Typography.Text>
          ) : (
            data.tests.map((test) => (
              <div key={test.id} className={styles.actions}>
                <Typography.Text>
                  {test.title} · {test._count.questions} soraw
                </Typography.Text>
                <Button
                  type="primary"
                  icon={<FileDoneOutlined />}
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
                  Testti baslaw
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

const StudentChapterDetail = () => {
  const { chapterId } = useParams();
  return <ChapterContent key={chapterId} id={Number(chapterId)} />;
};

export default StudentChapterDetail;
