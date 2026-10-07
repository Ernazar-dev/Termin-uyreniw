import { Drawer, Grid } from 'antd';
import { resultsApi } from '../../../api';
import { ContentSkeleton, ErrorState, ResultQuestions, ResultSummary } from '../../../components';
import { useRequest } from '../../../hooks/useRequest';
import styles from '../../../styles/page.module.scss';

interface ResultDetailDrawerProps {
  resultId: number | null;
  onClose: () => void;
}

export const ResultDetailDrawer = ({ resultId, onClose }: ResultDetailDrawerProps) => {
  const screens = Grid.useBreakpoint();
  const { data, loading, error, reload } = useRequest(
    () => resultsApi.get(resultId as number),
    [resultId],
    resultId !== null,
  );

  return (
    <Drawer
      open={resultId !== null}
      onClose={onClose}
      title="Nátiyje tolıǵıraq"
      size={screens.md ? 760 : '100%'}
      destroyOnHidden
    >
      {error && <ErrorState message={error} onRetry={reload} />}
      {!error && (loading || !data) && <ContentSkeleton rows={10} />}
      {!error && !loading && data && (
        <div className={styles.stack}>
          <ResultSummary result={data} />
          <ResultQuestions result={data} />
        </div>
      )}
    </Drawer>
  );
};
