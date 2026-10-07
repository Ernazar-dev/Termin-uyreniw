import { AppstoreOutlined, PlusOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, Table, Tag, Typography } from 'antd';
import { classesApi } from '../../../api';
import { ErrorState, PageHeader } from '../../../components';
import { EmptyState } from '../../../components/EmptyState/EmptyState';
import { TableActions } from '../../../components/TableActions/TableActions';
import { useConfirmDelete } from '../../../hooks/useConfirmDelete';
import { useModalForm } from '../../../hooks/useModalForm';
import { useOpenCreateFromState } from '../../../hooks/useOpenCreateFromState';
import { useRequest } from '../../../hooks/useRequest';
import type { ClassPayload } from '../../../types/api';
import type { ClassItem } from '../../../types/models';
import { TEXT } from '../../../utils/constants';
import { ClassFormModal } from './ClassFormModal';

const TeacherClasses = () => {
  const { data, loading, error, reload } = useRequest(() => classesApi.list(), []);
  const modal = useModalForm<ClassItem>();
  const confirmDelete = useConfirmDelete();
  useOpenCreateFromState(modal.openCreate);

  const handleSubmit = (values: ClassPayload) =>
    modal.submit(
      () => (modal.editing ? classesApi.update(modal.editing.id, values) : classesApi.create(values)),
      reload,
    );

  const handleDelete = (record: ClassItem) =>
    confirmDelete({
      title: `«${record.name}» óshirilsin be?`,
      content: 'Klasstıń barlıq baplari, terminleri, oyınları hám testleri de óshiriledi.',
      onDelete: () => classesApi.remove(record.id),
      onSuccess: reload,
    });

  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader
        icon={<AppstoreOutlined />}
        tone="indigo"
        title="Klasslar"
        subtitle={data ? `Barlıǵı: ${data.length}` : undefined}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={modal.openCreate}>
            {TEXT.add}
          </Button>
        }
      />

      <Card>
        <Table<ClassItem>
          rowKey="id"
          loading={loading}
          dataSource={data}
          pagination={false}
          scroll={{ x: 520 }}
          locale={{ emptyText: <EmptyState plain description="Klasslar qosılmaǵan." /> }}
          columns={[
            { title: '№', width: 64, render: (_, __, index) => index + 1 },
            {
              title: 'Klass',
              dataIndex: 'name',
              render: (name: string) => (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
                  <Avatar shape="square" style={{ background: '#eef0ff', color: '#4f46e5', fontWeight: 700 }}>
                    {name.match(/\d+/)?.[0] ?? name[0]}
                  </Avatar>
                  <Typography.Text strong>{name}</Typography.Text>
                </span>
              ),
            },
            {
              title: 'Baplar',
              dataIndex: ['_count', 'chapters'],
              width: 120,
              render: (value: number) => <Tag color="purple">{value}</Tag>,
            },
            {
              title: 'Oqıwshılar',
              dataIndex: ['_count', 'students'],
              width: 130,
              render: (value: number) => <Tag color="cyan">{value}</Tag>,
            },
            {
              title: '',
              key: 'actions',
              fixed: 'right',
              width: 100,
              align: 'right',
              render: (_, record) => (
                <TableActions onEdit={() => modal.openEdit(record)} onDelete={() => handleDelete(record)} />
              ),
            },
          ]}
        />
      </Card>

      <ClassFormModal
        open={modal.open}
        editing={modal.editing}
        submitting={modal.submitting}
        onCancel={modal.close}
        onSubmit={handleSubmit}
      />
    </>
  );
};

export default TeacherClasses;
