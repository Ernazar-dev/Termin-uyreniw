import { PlusOutlined, ReadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Input, Table, Typography } from 'antd';
import { useState } from 'react';
import { termsApi } from '../../../api';
import { ChapterSelect, ClassSelect, EmptyState, ErrorState, PageHeader } from '../../../components';
import { TableActions } from '../../../components/TableActions/TableActions';
import { useCatalog } from '../../../hooks/useCatalog';
import { useConfirmDelete } from '../../../hooks/useConfirmDelete';
import { useDebounce } from '../../../hooks/useDebounce';
import { useModalForm } from '../../../hooks/useModalForm';
import { useOpenCreateFromState } from '../../../hooks/useOpenCreateFromState';
import { useRequest } from '../../../hooks/useRequest';
import styles from '../../../styles/page.module.scss';
import type { Term } from '../../../types/models';
import { TABLE_PAGE_SIZE, TEXT } from '../../../utils/constants';
import { chapterLabel, resolveImageUrl } from '../../../utils/format';
import { TermFormModal } from './TermFormModal';

const THUMB_STYLE = { width: 48, height: 36, objectFit: 'cover' as const, borderRadius: 6 };

const TeacherTerms = () => {
  const [search, setSearch] = useState('');
  const [classId, setClassId] = useState<number>();
  const [chapterId, setChapterId] = useState<number>();
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);
  const { classes, chapters } = useCatalog();

  const { data, loading, error, reload } = useRequest(
    () => termsApi.list({ search: debouncedSearch || undefined, classId, chapterId, page, pageSize: TABLE_PAGE_SIZE }),
    [debouncedSearch, classId, chapterId, page],
  );
  const modal = useModalForm<Term>();
  const confirmDelete = useConfirmDelete();
  useOpenCreateFromState(modal.openCreate);

  const resetPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  const handleSubmit = (formData: FormData, again: boolean) =>
    modal.submit(
      () => (modal.editing ? termsApi.update(modal.editing.id, formData) : termsApi.create(formData)),
      reload,
      { keepOpen: again },
    );

  const handleDelete = (record: Term) =>
    confirmDelete({
      title: `«${record.name}» termini óshirilsin be?`,
      onDelete: () => termsApi.remove(record.id),
      onSuccess: reload,
    });

  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader
        icon={<ReadOutlined />}
        tone="teal"
        title="Terminler"
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
            placeholder="Termindi izlew..."
            value={search}
            onChange={(event) => resetPage(setSearch)(event.target.value)}
          />
          <ClassSelect
            classes={classes}
            value={classId}
            allowClear
            placeholder="Barlıq klasslar"
            onChange={(value) => {
              resetPage(setClassId)(value);
              setChapterId(undefined);
            }}
          />
          <ChapterSelect
            chapters={chapters}
            classId={classId}
            value={chapterId}
            allowClear
            placeholder="Barlıq baplar"
            onChange={resetPage(setChapterId)}
          />
        </div>

        <Table<Term>
          rowKey="id"
          loading={loading}
          dataSource={data?.items}
          scroll={{ x: 820 }}
          locale={{ emptyText: <EmptyState plain description="Házirge shekem termin qosılmaǵan." /> }}
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
              title: 'Termin',
              dataIndex: 'name',
              width: 220,
              render: (name: string, record) => {
                const imageUrl = resolveImageUrl(record.image);
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {imageUrl && <img src={imageUrl} alt="" style={THUMB_STYLE} loading="lazy" />}
                    <Typography.Text strong>{name}</Typography.Text>
                  </div>
                );
              },
            },
            {
              title: 'Mánisi',
              dataIndex: 'definition',
              ellipsis: true,
            },
            { title: 'Bap', width: 200, ellipsis: true, render: (_, record) => chapterLabel(record.chapter) },
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

      <TermFormModal
        open={modal.open}
        editing={modal.editing}
        classes={classes}
        chapters={chapters}
        submitting={modal.submitting}
        onCancel={modal.close}
        onSubmit={handleSubmit}
      />
    </>
  );
};

export default TeacherTerms;
