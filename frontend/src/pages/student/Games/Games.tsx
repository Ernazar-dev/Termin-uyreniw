import { Button, Card, Tag, Typography } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { chaptersApi } from '../../../api';
import { CardsSkeleton, ClassSelect, EmptyState, ErrorState, PageHeader } from '../../../components';
import { useAuth } from '../../../hooks/useAuth';
import { useCatalog } from '../../../hooks/useCatalog';
import { useRequest } from '../../../hooks/useRequest';
import styles from '../../../styles/page.module.scss';
import { ROUTES } from '../../../utils/constants';

const StudentGames = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classId, setClassId] = useState<number | undefined>(user?.classId ?? undefined);
  const { classes } = useCatalog();
  const { data, loading, error, reload } = useRequest(() => chaptersApi.list({ classId }), [classId]);

  const chaptersWithGames = data?.filter((chapter) => chapter._count.games > 0) ?? [];

  return (
    <>
      <PageHeader
        title="Interaktiv shınıǵıwlar"
        subtitle="Hár sorawǵa bir márte juwap beriń. Sońında nátiyjeni kóriń."
      />

      <div className={styles.toolbar}>
        <ClassSelect classes={classes} value={classId} onChange={setClassId} allowClear placeholder="Barlıq klasslar" />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <CardsSkeleton count={3} />
      ) : chaptersWithGames.length === 0 ? (
        <EmptyState description="Oyın qosılmaǵan." />
      ) : (
        <div className={styles.grid}>
          {chaptersWithGames.map((chapter) => (
            <Card key={chapter.id} hoverable>
              <Typography.Text type="secondary">{chapter.class.name}</Typography.Text>
              <Typography.Title level={5} style={{ marginTop: 4 }}>
                {chapter.title}
              </Typography.Title>
              <div className={styles.actions}>
                <Tag color="blue">{chapter._count.games} shınıǵıw</Tag>
                <Button type="primary" onClick={() => navigate(ROUTES.student.gamePlay(chapter.id))}>Baslaw</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
};

export default StudentGames;
