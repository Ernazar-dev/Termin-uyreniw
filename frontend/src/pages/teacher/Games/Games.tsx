import { PlayCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Select, Table, Tag } from 'antd';
import { useState } from 'react';
import { gamesApi } from '../../../api';
import { ChapterSelect, ClassSelect, EmptyState, ErrorState, PageHeader } from '../../../components';
import { TableActions } from '../../../components/TableActions/TableActions';
import { useCatalog } from '../../../hooks/useCatalog';
import { useConfirmDelete } from '../../../hooks/useConfirmDelete';
import { useModalForm } from '../../../hooks/useModalForm';
import { useOpenCreateFromState } from '../../../hooks/useOpenCreateFromState';
import { useRequest } from '../../../hooks/useRequest';
import styles from '../../../styles/page.module.scss';
import type { GamePayload } from '../../../types/api';
import type { Game, GameType } from '../../../types/models';
import { GAME_TYPE_LABELS, TABLE_PAGE_SIZE, TEXT } from '../../../utils/constants';
import { chapterLabel } from '../../../utils/format';
import { GameFormModal } from './GameFormModal';

const TYPE_OPTIONS = (Object.keys(GAME_TYPE_LABELS) as GameType[]).map((type) => ({
  value: type,
  label: GAME_TYPE_LABELS[type],
}));

const TeacherGames = () => {
  const [classId, setClassId] = useState<number>();
  const [chapterId, setChapterId] = useState<number>();
  const [type, setType] = useState<GameType>();
  const { classes, chapters } = useCatalog();
  const { data, loading, error, reload } = useRequest(
    () => gamesApi.list({ classId, chapterId, type }),
    [classId, chapterId, type],
  );
  const modal = useModalForm<Game>();
  const confirmDelete = useConfirmDelete();
  useOpenCreateFromState(modal.openCreate);

  const handleSubmit = (values: GamePayload, again: boolean) =>
    modal.submit(
      () => (modal.editing ? gamesApi.update(modal.editing.id, values) : gamesApi.create(values)),
      reload,
      { keepOpen: again },
    );

  const handleDelete = (record: Game) =>
    confirmDelete({ onDelete: () => gamesApi.remove(record.id), onSuccess: reload });

  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader
        icon={<PlayCircleOutlined />}
        tone="amber"
        title="Oyınlar"
        subtitle="Interaktiv shınıǵıwlar bahalanbaydı — tek úyreniw ushın"
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
          <Select<GameType>
            value={type}
            onChange={setType}
            allowClear
            placeholder="Barlıq túrler"
            options={TYPE_OPTIONS}
          />
        </div>

        <Table<Game>
          rowKey="id"
          loading={loading}
          dataSource={data}
          scroll={{ x: 820 }}
          pagination={{ pageSize: TABLE_PAGE_SIZE, hideOnSinglePage: true }}
          locale={{ emptyText: <EmptyState plain description="Oyın qosılmaǵan." /> }}
          columns={[
            { title: 'Soraw', dataIndex: 'question', ellipsis: true },
            {
              title: 'Túri',
              dataIndex: 'type',
              width: 190,
              render: (value: GameType) => <Tag color="blue">{GAME_TYPE_LABELS[value]}</Tag>,
            },
            { title: 'Termin', width: 150, render: (_, record) => record.term?.name ?? '—' },
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

      <GameFormModal
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

export default TeacherGames;
