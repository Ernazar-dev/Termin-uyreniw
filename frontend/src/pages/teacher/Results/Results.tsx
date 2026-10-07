import { BarChartOutlined } from '@ant-design/icons';
import { Card, Select, Table } from 'antd';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { resultsApi, studentsApi } from '../../../api';
import { ChapterSelect, ClassSelect, EmptyState, ErrorState, PageHeader, ScoreTag } from '../../../components';
import { TableActions } from '../../../components/TableActions/TableActions';
import { useCatalog } from '../../../hooks/useCatalog';
import { useConfirmDelete } from '../../../hooks/useConfirmDelete';
import { useDebounce } from '../../../hooks/useDebounce';
import { useRequest } from '../../../hooks/useRequest';
import styles from '../../../styles/page.module.scss';
import type { ResultListItem } from '../../../types/models';
import { TABLE_PAGE_SIZE } from '../../../utils/constants';
import { formatDate } from '../../../utils/format';
import { ResultDetailDrawer } from './ResultDetailDrawer';

const MAX_STUDENTS_FOR_SELECT = 100;

const parseId = (value: string | null) => (value && Number(value) > 0 ? Number(value) : undefined);

const TeacherResults = () => {
  const [searchParams] = useSearchParams();
  const [classId, setClassId] = useState<number>();
  const [chapterId, setChapterId] = useState<number>();
  const [studentId, setStudentId] = useState<number | undefined>(() => parseId(searchParams.get('studentId')));
  const [page, setPage] = useState(1);
  const [openedId, setOpenedId] = useState<number | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const debouncedStudentSearch = useDebounce(studentSearch.trim());
  const { classes, chapters } = useCatalog();
  const confirmDelete = useConfirmDelete();

  const students = useRequest(
    () => studentsApi.list({ classId, search: debouncedStudentSearch || undefined, pageSize: MAX_STUDENTS_FOR_SELECT }),
    [classId, debouncedStudentSearch],
  );
  const { data, loading, error, reload } = useRequest(
    () => resultsApi.list({ classId, chapterId, studentId, page, pageSize: TABLE_PAGE_SIZE }),
    [classId, chapterId, studentId, page],
  );

  const withPageReset = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  const handleDelete = (record: ResultListItem) =>
    confirmDelete({
      title: 'Nátiyje óshirilsin be?',
      onDelete: () => resultsApi.remove(record.id),
      onSuccess: reload,
    });

  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader icon={<BarChartOutlined />} tone="teal" title="Nátiyjeler" subtitle="Oqıwshılardıń test nátiyjeleri" />

      <Card>
        <div className={styles.toolbar}>
          <ClassSelect
            classes={classes}
            value={classId}
            allowClear
            placeholder="Barlıq klasslar"
            onChange={(value) => {
              withPageReset(setClassId)(value);
              setChapterId(undefined);
              setStudentId(undefined);
              setStudentSearch('');
            }}
          />
          <ChapterSelect
            chapters={chapters}
            classId={classId}
            value={chapterId}
            allowClear
            placeholder="Barlıq baplar"
            onChange={withPageReset(setChapterId)}
          />
          <Select<number>
            value={studentId}
            allowClear
            placeholder="Barlıq oqıwshılar"
            loading={students.loading}
            showSearch={{ filterOption: false, searchValue: studentSearch, onSearch: setStudentSearch }}
            onChange={withPageReset(setStudentId)}
            options={(students.data?.items ?? []).map((student) => ({ value: student.id, label: student.fullName }))}
          />
        </div>

        <Table<ResultListItem>
          rowKey="id"
          loading={loading}
          dataSource={data?.items}
          scroll={{ x: 900 }}
          locale={{ emptyText: <EmptyState plain description="Nátiyjeler joq." /> }}
          onRow={(record) => ({ onClick: () => setOpenedId(record.id), style: { cursor: 'pointer' } })}
          pagination={{
            current: page,
            pageSize: TABLE_PAGE_SIZE,
            total: data?.total ?? 0,
            onChange: setPage,
            showSizeChanger: false,
            hideOnSinglePage: true,
          }}
          columns={[
            { title: 'Oqıwshı', dataIndex: ['student', 'fullName'] },
            { title: 'Klass', width: 90, render: (_, record) => record.student.class?.name ?? '—' },
            { title: 'Bap', render: (_, record) => record.test.chapter.title },
            { title: 'Test', dataIndex: ['test', 'title'] },
            {
              title: 'Nátiyje',
              width: 150,
              render: (_, record) => (
                <ScoreTag correct={record.correctAnswers} total={record.totalQuestions} percentage={record.percentage} />
              ),
            },
            { title: 'Sáne', dataIndex: 'submittedAt', width: 150, render: formatDate },
            {
              title: '',
              key: 'actions',
              fixed: 'right',
              width: 60,
              align: 'right',
              render: (_, record) => <TableActions onDelete={() => handleDelete(record)} />,
            },
          ]}
        />
      </Card>

      <ResultDetailDrawer resultId={openedId} onClose={() => setOpenedId(null)} />
    </>
  );
};

export default TeacherResults;
