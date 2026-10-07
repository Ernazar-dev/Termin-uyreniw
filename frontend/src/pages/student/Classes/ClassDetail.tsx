import { Card, Tag, Typography } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { classesApi } from '../../../api';
import { CardsSkeleton, EmptyState, ErrorState, PageHeader } from '../../../components';
import { useRequest } from '../../../hooks/useRequest';
import styles from '../../../styles/page.module.scss';
import { ROUTES } from '../../../utils/constants';

const StudentClassDetail = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useRequest(() => classesApi.get(Number(classId)), [classId]);

  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader title={data?.name ?? 'Klass'} subtitle="Baplar" back={ROUTES.student.classes} />
      {loading || !data ? (
        <CardsSkeleton count={3} />
      ) : data.chapters.length === 0 ? (
        <EmptyState description="Bul klass ushın baplar ele qosılmaǵan." />
      ) : (
        <div className={styles.grid}>
          {data.chapters.map((chapter) => (
            <Card key={chapter.id} hoverable role="link" tabIndex={0}
              onClick={() => navigate(ROUTES.student.chapter(chapter.id))}
              onKeyDown={(event) => {
                if (event.key === 'Enter') navigate(ROUTES.student.chapter(chapter.id));
              }}>
              <Typography.Title level={5} style={{ marginTop: 0 }}>
                {chapter.title}
              </Typography.Title>
              <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }}>
                {chapter.description ?? `${chapter.startTopic}–${chapter.endTopic}-temalar`}
              </Typography.Paragraph>
              <Tag>{chapter._count.terms} termin</Tag>
              <Tag>{chapter._count.games} shınıǵıw</Tag>
              <Tag>{chapter._count.tests} test</Tag>
            </Card>
          ))}
        </div>
      )}
    </>
  );
};

export default StudentClassDetail;
