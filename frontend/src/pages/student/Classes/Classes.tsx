import { ArrowRightOutlined, BookOutlined } from '@ant-design/icons';
import { Card, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { classesApi } from '../../../api';
import { CardsSkeleton, EmptyState, ErrorState, PageHeader } from '../../../components';
import { useAuth } from '../../../hooks/useAuth';
import { useRequest } from '../../../hooks/useRequest';
import { ROUTES } from '../../../utils/constants';
import classStyles from './Classes.module.scss';

/** Each class card gets its own accent so the grid feels lively but stays consistent. */
const TONES = ['indigo', 'amber', 'teal', 'pink', 'violet'] as const;

const StudentClasses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useRequest(() => classesApi.list(), []);

  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader title="Klasslar" subtitle="Klassıńızdı tańlań" />
      {loading || !data ? (
        <CardsSkeleton count={5} />
      ) : data.length === 0 ? (
        <EmptyState description="Klasslar ele qosılmaǵan." />
      ) : (
        <div className={classStyles.grid}>
          {data.map((item, index) => (
            <Card
              key={item.id}
              hoverable
              className={`${classStyles.card} ${classStyles[TONES[index % TONES.length]]}`}
              style={{ animationDelay: `${index * 70}ms` }}
              onClick={() => navigate(ROUTES.student.classDetail(item.id))}
            >
              <div className={classStyles.top}>
                <span className={classStyles.icon} aria-hidden="true"><BookOutlined /></span>
                {item.id === user?.classId && <Tag color="purple">Seniń klasıń</Tag>}
              </div>
              <h3 className={classStyles.name}>{item.name}</h3>
              <div className={classStyles.cardFooter}>
                <span className={classStyles.count}>{item._count.chapters} bap</span>
                <button
                  type="button"
                  className={classStyles.open}
                  aria-label={`${item.name}: baplardı ashıw`}
                  onClick={(event) => { event.stopPropagation(); navigate(ROUTES.student.classDetail(item.id)); }}
                >
                  Ashıw <ArrowRightOutlined />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
};

export default StudentClasses;
