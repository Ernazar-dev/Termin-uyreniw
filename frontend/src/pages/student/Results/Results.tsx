import { Card, Table } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resultsApi } from '../../../api';
import { EmptyState, ErrorState, PageHeader, ScoreTag } from '../../../components';
import { useRequest } from '../../../hooks/useRequest';
import type { ResultListItem } from '../../../types/models';
import { ROUTES, TABLE_PAGE_SIZE } from '../../../utils/constants';
import { formatDate } from '../../../utils/format';

const StudentResults = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useRequest(
    () => resultsApi.list({ page, pageSize: TABLE_PAGE_SIZE }),
    [page],
  );

  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader title="Nátiyjeler" subtitle="Tapsırılǵan testleriń" />
      <Card>
        <Table<ResultListItem>
          rowKey="id"
          loading={loading}
          dataSource={data?.items}
          scroll={{ x: 640 }}
          locale={{ emptyText: <EmptyState plain description="Siz ele test tapsırmadıńız." /> }}
          onRow={(record) => ({
            onClick: () => navigate(ROUTES.student.result(record.id)),
            style: { cursor: 'pointer' },
          })}
          pagination={{
            current: page,
            pageSize: TABLE_PAGE_SIZE,
            total: data?.total ?? 0,
            onChange: setPage,
            hideOnSinglePage: true,
            showSizeChanger: false,
          }}
          columns={[
            { title: 'Test', dataIndex: ['test', 'title'] },
            { title: 'Bap', render: (_, record) => `${record.test.chapter.class.name} · ${record.test.chapter.title}` },
            {
              title: 'Nátiyje',
              width: 150,
              render: (_, record) => (
                <ScoreTag correct={record.correctAnswers} total={record.totalQuestions} percentage={record.percentage} />
              ),
            },
            { title: 'Sáne', dataIndex: 'submittedAt', width: 150, render: formatDate },
          ]}
        />
      </Card>
    </>
  );
};

export default StudentResults;
