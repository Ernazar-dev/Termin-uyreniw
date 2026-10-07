import { LeftOutlined, PlayCircleOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Typography } from 'antd';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { termsApi } from '../../../api';
import { ContentSkeleton, ErrorState, PageHeader, TermCard } from '../../../components';
import { useRequest } from '../../../hooks/useRequest';
import styles from '../../../styles/page.module.scss';
import { ROUTES } from '../../../utils/constants';

const StudentTermDetail = () => {
  const { termId } = useParams();
  const id = Number(termId);
  const navigate = useNavigate();
  const { data, loading, error, reload } = useRequest(() => termsApi.get(id), [id]);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !data) return <ContentSkeleton rows={8} />;

  const index = data.siblings.findIndex((sibling) => sibling.id === data.id);
  const previous = index > 0 ? data.siblings[index - 1] : null;
  const next = index >= 0 && index < data.siblings.length - 1 ? data.siblings[index + 1] : null;

  return (
    <div className={styles.stack}>
      <PageHeader
        title="Termin"
        subtitle={`${data.chapter.class.name} · ${data.chapter.title}`}
        back={ROUTES.student.chapter(data.chapterId)}
        extra={
          <Button icon={<PlayCircleOutlined />} onClick={() => navigate(ROUTES.student.gamePlay(data.chapterId))}>
            Shınıǵıwlar
          </Button>
        }
      />

      <div className={styles.workspace}>
      <div className={styles.stack}>
      <TermCard term={data} variant="full" />

      <div className={styles.actions}>
        <Button
          icon={<LeftOutlined />}
          disabled={!previous}
          onClick={() => previous && navigate(ROUTES.student.term(previous.id))}
        >
          {previous?.name ?? 'Aldınǵı'}
        </Button>
        <Button disabled={!next} onClick={() => next && navigate(ROUTES.student.term(next.id))}>
          {next?.name ?? 'Keyingi'} <RightOutlined />
        </Button>
      </div>
      </div>
      <aside className={styles.sidePanel}>
        <Typography.Title level={5} className={styles.sectionTitle}>Baptaǵı terminler</Typography.Title>
        <Typography.Paragraph type="secondary">{index + 1} / {data.siblings.length} · {data.chapter.title}</Typography.Paragraph>
        <nav className={styles.termNav} aria-label="Baptaǵı terminler">
          {data.siblings.map((term) => (
            <Link key={term.id} to={ROUTES.student.term(term.id)} aria-current={term.id === data.id ? 'page' : undefined}>
              {term.name}
            </Link>
          ))}
        </nav>
      </aside>
      </div>
    </div>
  );
};

export default StudentTermDetail;
