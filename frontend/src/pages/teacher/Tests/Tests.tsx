import { FileDoneOutlined, FilePdfOutlined, PlusOutlined } from '@ant-design/icons';
import { App, Button, Card, Table, Tag } from 'antd';
import { useState } from 'react';
import { testsApi } from '../../../api';
import { ChapterSelect, ClassSelect, EmptyState, ErrorState, PageHeader } from '../../../components';
import { TableActions } from '../../../components/TableActions/TableActions';
import { useCatalog } from '../../../hooks/useCatalog';
import { useConfirmDelete } from '../../../hooks/useConfirmDelete';
import { useModalForm } from '../../../hooks/useModalForm';
import { useOpenCreateFromState } from '../../../hooks/useOpenCreateFromState';
import { useRequest } from '../../../hooks/useRequest';
import styles from '../../../styles/page.module.scss';
import type { TestDetail, TestListItem } from '../../../types/models';
import { TABLE_PAGE_SIZE, TEXT } from '../../../utils/constants';
import { getErrorMessage } from '../../../utils/error';
import { chapterLabel } from '../../../utils/format';
import { TestFormModal, type TestSubmission } from './TestFormModal';

const TeacherTests = () => {
  const { message } = App.useApp();
  const [classId, setClassId] = useState<number>();
  const [chapterId, setChapterId] = useState<number>();
  const [loadingEditId, setLoadingEditId] = useState<number | null>(null);
  const { classes, chapters } = useCatalog();
  const { data, loading, error, reload } = useRequest(
    () => testsApi.list({ classId, chapterId }),
    [classId, chapterId],
  );
  const modal = useModalForm<TestDetail>();
  const confirmDelete = useConfirmDelete();
  useOpenCreateFromState(modal.openCreate);

  // The list has no questions, so the full test is loaded before editing
  const handleEdit = async (record: TestListItem) => {
    setLoadingEditId(record.id);
    try {
      modal.openEdit(await testsApi.get(record.id));
    } catch (loadError) {
      message.error(getErrorMessage(loadError));
    } finally {
      setLoadingEditId(null);
    }
  };

  const handleSubmit = (submission: TestSubmission) => {
    const editingId = modal.editing?.id;
    const save = () => {
      if (submission.mode === 'file') {
        return editingId
          ? testsApi.updateFromFile(editingId, submission.formData)
          : testsApi.createFromFile(submission.formData);
      }
      return editingId ? testsApi.update(editingId, submission.values) : testsApi.create(submission.values);
    };
    return modal.submit(save, reload);
  };

  const handleDelete = (record: TestListItem) =>
    confirmDelete({
      title: `«${record.title}» óshirilsin be?`,
      content: 'Bul testtiń barlıq nátiyjeleri de óshiriledi.',
      onDelete: () => testsApi.remove(record.id),
      onSuccess: reload,
    });

  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader
        icon={<FileDoneOutlined />}
        tone="pink"
        title="Testler"
        subtitle="Hár bap sońındaǵı bahalanatuǵın testler"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={modal.openCreate}>
            {TEXT.add}
          </Button>
        }
      />

      <Card>
        <div className={styles.toolbar}>
          <ClassSelect
            classes={classes}
            value={classId}
            allowClear
            placeholder="Barlıq klasslar"
            onChange={(value) => {
              setClassId(value);
              setChapterId(undefined);
            }}
          />
          <ChapterSelect
            chapters={chapters}
            classId={classId}
            value={chapterId}
            allowClear
            placeholder="Barlıq baplar"
            onChange={setChapterId}
          />
        </div>

        <Table<TestListItem>
          rowKey="id"
          loading={loading}
          dataSource={data}
          scroll={{ x: 720 }}
          pagination={{ pageSize: TABLE_PAGE_SIZE, hideOnSinglePage: true }}
          locale={{ emptyText: <EmptyState plain description="Test joq." /> }}
          columns={[
            {
              title: 'Test',
              dataIndex: 'title',
              render: (title: string, record) => (
                <span>
                  {title}{' '}
                  {record.hasFile && (
                    <Tag color="red" icon={<FilePdfOutlined />} style={{ marginLeft: 6 }}>
                      Fayl
                    </Tag>
                  )}
                </span>
              ),
            },
            { title: 'Bap', width: 240, render: (_, record) => chapterLabel(record.chapter) },
            { title: 'Sorawlar', dataIndex: ['_count', 'questions'], width: 100 },
            { title: 'Tapsırǵanlar', dataIndex: ['_count', 'results'], width: 120 },
            {
              title: '',
              key: 'actions',
              fixed: 'right',
              width: 100,
              align: 'right',
              render: (_, record) => (
                <TableActions
                  onEdit={loadingEditId === null ? () => void handleEdit(record) : undefined}
                  onDelete={() => handleDelete(record)}
                />
              ),
            },
          ]}
        />
      </Card>

      <TestFormModal
        open={modal.open}
        editing={modal.editing}
        chapters={chapters}
        defaultChapterId={chapterId}
        submitting={modal.submitting}
        onCancel={modal.close}
        onSubmit={handleSubmit}
      />
    </>
  );
};

export default TeacherTests;
