import { BarChartOutlined, PlusOutlined, SearchOutlined, TeamOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, Input, Progress, Table, Tag, Tooltip, Typography } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentsApi } from '../../../api';
import { ClassSelect, EmptyState, ErrorState, PageHeader } from '../../../components';
import { TableActions } from '../../../components/TableActions/TableActions';
import { useCatalog } from '../../../hooks/useCatalog';
import { useConfirmDelete } from '../../../hooks/useConfirmDelete';
import { useDebounce } from '../../../hooks/useDebounce';
import { useModalForm } from '../../../hooks/useModalForm';
import { useOpenCreateFromState } from '../../../hooks/useOpenCreateFromState';
import { useRequest } from '../../../hooks/useRequest';
import styles from '../../../styles/page.module.scss';
import type { StudentPayload } from '../../../types/api';
import type { Student } from '../../../types/models';
import { ROUTES, TABLE_PAGE_SIZE, TEXT } from '../../../utils/constants';
import { formatDateShort, getScoreStatus } from '../../../utils/format';
import { StudentFormModal } from './StudentFormModal';

const AVATAR_COLORS = ['#4f46e5', '#0d9488', '#db2777', '#d97706', '#7c3aed', '#16a34a'];

/** Same student always gets the same colour. */
const avatarColor = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length];

const initials = (fullName: string) =>
  fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

const STATUS_COLORS = { success: '#16a34a', warning: '#d97706', error: '#dc2626' } as const;

const TeacherStudents = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [classId, setClassId] = useState<number>();
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);
  const { classes } = useCatalog();
  const { data, loading, error, reload } = useRequest(
    () => studentsApi.list({ search: debouncedSearch || undefined, classId, page, pageSize: TABLE_PAGE_SIZE }),
    [debouncedSearch, classId, page],
  );
  const modal = useModalForm<Student>();
  const confirmDelete = useConfirmDelete();
  useOpenCreateFromState(modal.openCreate);

  const handleSubmit = (values: StudentPayload) =>
    modal.submit(
      () => (modal.editing ? studentsApi.update(modal.editing.id, values) : studentsApi.create(values)),
      reload,
    );

  const handleDelete = (record: Student) =>
    confirmDelete({
      title: `«${record.fullName}» óshirilsin be?`,
      content: 'Oqıwshınıń barlıq test nátiyjeleri de óshiriledi.',
      onDelete: () => studentsApi.remove(record.id),
      onSuccess: reload,
    });

  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader
        icon={<TeamOutlined />}
        tone="indigo"
        title="Oqıwshılar"
        subtitle={data ? `Barlıǵı: ${data.total}` : undefined}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={modal.openCreate}>
            {TEXT.add}
          </Button>
        }
      />

      <Card>
        <div className={styles.toolbar}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Atı yamasa kiriw atı boyınsha izlew"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
          <ClassSelect
            classes={classes}
            value={classId}
            allowClear
            placeholder="Barlıq klasslar"
            onChange={(value) => {
              setClassId(value);
              setPage(1);
            }}
          />
        </div>

        <Table<Student>
          rowKey="id"
          size="middle"
          loading={loading}
          dataSource={data?.items}
          scroll={{ x: 900 }}
          locale={{ emptyText: <EmptyState plain description="Oqıwshılar joq." /> }}
          pagination={{
            current: page,
            pageSize: TABLE_PAGE_SIZE,
            total: data?.total ?? 0,
            onChange: setPage,
            showSizeChanger: false,
            hideOnSinglePage: true,
          }}
          columns={[
            {
              title: '№',
              width: 56,
              align: 'center',
              render: (_, __, index) => (page - 1) * TABLE_PAGE_SIZE + index + 1,
            },
            {
              title: 'Oqıwshı',
              dataIndex: 'fullName',
              width: 240,
              render: (_: string, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <Avatar style={{ background: avatarColor(record.id), flexShrink: 0, fontWeight: 700 }}>
                    {initials(record.fullName)}
                  </Avatar>
                  <div style={{ minWidth: 0, lineHeight: 1.35 }}>
                    <Typography.Text strong ellipsis style={{ display: 'block' }}>
                      {record.fullName}
                    </Typography.Text>
                    <Typography.Text type="secondary" ellipsis style={{ display: 'block', fontSize: 13 }}>
                      @{record.login}
                    </Typography.Text>
                  </div>
                </div>
              ),
            },
            {
              title: 'Klass',
              width: 100,
              render: (_, record) => (record.class ? <Tag color="blue">{record.class.name}</Tag> : '—'),
            },
            {
              title: 'Terminler',
              dataIndex: 'viewedTerms',
              width: 120,
              align: 'center',
              render: (value: number) => <Tag color="purple">{value}</Tag>,
            },
            {
              title: 'Testler',
              dataIndex: 'testsTaken',
              width: 80,
              align: 'center',
              render: (value: number) => <Tag color="cyan">{value}</Tag>,
            },
            {
              title: 'Ortasha nátiyje',
              dataIndex: 'averagePercentage',
              width: 170,
              render: (value: number | null) =>
                value == null ? (
                  <Typography.Text type="secondary">—</Typography.Text>
                ) : (
                  <Progress
                    percent={Math.round(value)}
                    size="small"
                    strokeColor={STATUS_COLORS[getScoreStatus(value)]}
                  />
                ),
            },
            {
              title: 'Dizimnen ótken',
              dataIndex: 'createdAt',
              width: 135,
              render: (value: string) => formatDateShort(value),
            },
            {
              title: '',
              key: 'actions',
              width: 130,
              align: 'right',
              render: (_, record) => (
                <TableActions
                  extra={
                    <Tooltip title="Nátiyjeler">
                      <Button
                        type="text"
                        icon={<BarChartOutlined />}
                        aria-label="Nátiyjeler"
                        onClick={() => navigate(`${ROUTES.teacher.results}?studentId=${record.id}`)}
                      />
                    </Tooltip>
                  }
                  onEdit={() => modal.openEdit(record)}
                  onDelete={() => handleDelete(record)}
                />
              ),
            },
          ]}
        />
      </Card>

      <StudentFormModal
        open={modal.open}
        editing={modal.editing}
        classes={classes}
        submitting={modal.submitting}
        onCancel={modal.close}
        onSubmit={handleSubmit}
      />
    </>
  );
};

export default TeacherStudents;
