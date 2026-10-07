import { ReloadOutlined } from '@ant-design/icons';
import { Button, Typography } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { resultsApi } from '../../../api';
import { ContentSkeleton, ErrorState, PageHeader, ResultQuestions, ResultSummary } from '../../../components';
import { useRequest } from '../../../hooks/useRequest';
import styles from '../../../styles/page.module.scss';
import { ROUTES } from '../../../utils/constants';

const StudentResultDetail = () => {
  const { resultId } = useParams();
  const id = Number(resultId);
  const navigate = useNavigate();
  const { data, loading, error, reload } = useRequest(() => resultsApi.get(id), [id]);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !data) return <ContentSkeleton rows={10} />;

  return (
    <div className={`${styles.stack} ${styles.narrow}`}>
      <PageHeader
        title="Test nátiyjesi"
        back={ROUTES.student.results}
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => navigate(ROUTES.student.test(data.testId))}>
            Qayta tapsırıw
          </Button>
        }
      />
      <ResultSummary result={data} />
      <section>
        <Typography.Title level={5} className={styles.sectionTitle}>
          Sorawlar boyınsha nátiyje
        </Typography.Title>
        <ResultQuestions result={data} />
      </section>
    </div>
  );
};

export default StudentResultDetail;
