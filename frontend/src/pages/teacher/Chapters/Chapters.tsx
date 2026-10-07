import { BookOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Table, Tag } from 'antd';
import { useState } from 'react';
import { chaptersApi } from '../../../api';
import { ClassSelect, EmptyState, ErrorState, PageHeader } from '../../../components';
import { TableActions } from '../../../components/TableActions/TableActions';
import { useCatalog } from '../../../hooks/useCatalog';
import { useConfirmDelete } from '../../../hooks/useConfirmDelete';
import { useModalForm } from '../../../hooks/useModalForm';
import { useOpenCreateFromState } from '../../../hooks/useOpenCreateFromState';
import { useRequest } from '../../../hooks/useRequest';
import styles from '../../../styles/page.module.scss';
import type { ChapterPayload } from '../../../types/api';
import type { Chapter } from '../../../types/models';
import { TABLE_PAGE_SIZE, TEXT } from '../../../utils/constants';
import { ChapterFormModal } from './ChapterFormModal';

const TeacherChapters = () => {
  const [classId, setClassId] = useState<number>();
  const catalog = useCatalog();
  const { classes } = catalog;
  const { data, loading, error, reload } = useRequest(() => chaptersApi.list({ classId }), [classId]);
  const modal = useModalForm<Chapter>();
  const confirmDelete = useConfirmDelete();
  useOpenCreateFromState(modal.openCreate);

  const handleSubmit = (values: ChapterPayload) =>
    modal.submit(
      () => (modal.editing ? chaptersApi.update(modal.editing.id, values) : chaptersApi.create(values)),
      () => {
        reload();
        catalog.reload();
      },
    );

  const handleDelete = (record: Chapter) =>
    confirmDelete({
      title: `«${record.title}» óshirilsin be?`,
      content: 'Baptaǵı barlıq terminler, oyınlar hám testler de óshiriledi.',
      onDelete: () => chaptersApi.remove(record.id),
      onSuccess: () => {
        reload();
        catalog.reload();
      },
    });

  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader
        icon={<BookOutlined />}
        tone="violet"
        title="Baplar"
        subtitle="Terminler baplar boyınsha toparlanadı"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={modal.openCreate}>
            {TEXT.add}
          </Button>
        }
      />

      <Card>
        <div className={styles.toolbar}>
          <ClassSelect classes={classes} value={classId} onChange={setClassId} allowClear placeholder="Barlıq klasslar" />
        </div>
        <Table<Chapter>
          rowKey="id"
          loading={loading}
          dataSource={data}
          pagination={{ pageSize: TABLE_PAGE_SIZE, hideOnSinglePage: true }}
          scroll={{ x: 760 }}
          locale={{ emptyText: <EmptyState plain description="Baplar qosılmaǵan." /> }}
          columns={[
            { title: 'Klass', dataIndex: ['class', 'name'], width: 110, render: (name: string) => <Tag color="blue">{name}</Tag> },
            { title: 'Bap', dataIndex: 'title' },
            {
              title: 'Temalar',
              width: 110,
              render: (_, record) => `${record.startTopic}–${record.endTopic}`,
            },
            {
              title: 'Mazmunı',
              width: 260,
              render: (_, record) => (
                <>
                  <Tag color="purple">{record._count.terms} termin</Tag>
                  <Tag color="gold">{record._count.games} oyın</Tag>
                  <Tag color="cyan">{record._count.tests} test</Tag>
                </>
              ),
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

      <ChapterFormModal
        open={modal.open}
        editing={modal.editing}
        classes={classes}
        chapters={catalog.chapters}
        defaultClassId={classId}
        submitting={modal.submitting}
        onCancel={modal.close}
        onSubmit={handleSubmit}
      />
    </>
  );
};

export default TeacherChapters;
