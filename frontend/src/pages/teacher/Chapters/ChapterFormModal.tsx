import { Col, Form, Input, InputNumber, Row } from 'antd';
import { ClassSelect } from '../../../components';
import { FormModal } from '../../../components/FormModal/FormModal';
import type { ChapterPayload } from '../../../types/api';
import type { Chapter, ClassItem } from '../../../types/models';
import { TEXT } from '../../../utils/constants';

interface ChapterFormModalProps {
  open: boolean;
  editing: Chapter | null;
  classes: ClassItem[];
  /** Every chapter, used to hint which topics the previous chapter of the class ended with. */
  chapters: Chapter[];
  defaultClassId?: number;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: ChapterPayload) => void;
}

const toInitialValues = (chapter: Chapter | null, defaultClassId?: number): Partial<ChapterPayload> =>
  chapter
    ? {
        classId: chapter.classId,
        title: chapter.title,
        description: chapter.description,
        startTopic: chapter.startTopic,
        endTopic: chapter.endTopic,
      }
    : { classId: defaultClassId };

/** "Previous chapter: 1–10" under the first topic field, so the next range is easy to continue. */
const StartTopicField = ({ chapters, editingId }: { chapters: Chapter[]; editingId?: number }) => {
  const form = Form.useFormInstance<ChapterPayload>();
  const classId = Form.useWatch('classId', form);
  const last = chapters
    .filter((chapter) => chapter.classId === classId && chapter.id !== editingId)
    .reduce<Chapter | null>((best, chapter) => (!best || chapter.endTopic > best.endTopic ? chapter : best), null);

  return (
    <Form.Item
      label="Baslanǵısh tema"
      name="startTopic"
      extra={last ? `Aldınǵı bap ${last.endTopic}-temada tamamlanǵan` : undefined}
      rules={[{ required: true, message: TEXT.required }]}
    >
      <InputNumber min={1} style={{ width: '100%' }} placeholder={last ? String(last.endTopic + 1) : '1'} />
    </Form.Item>
  );
};

/** The position of a chapter inside its class is assigned automatically. */
export const ChapterFormModal = ({
  open,
  editing,
  classes,
  chapters,
  defaultClassId,
  submitting,
  onCancel,
  onSubmit,
}: ChapterFormModalProps) => (
  <FormModal<ChapterPayload>
    open={open}
    width={620}
    title={editing ? 'Bapti ózgertiw' : 'Jańa bap'}
    submitting={submitting}
    onCancel={onCancel}
    onSubmit={onSubmit}
    initialValues={toInitialValues(editing, defaultClassId)}
  >
    <Row gutter={16}>
      <Col xs={24} sm={10}>
        <Form.Item label="Klass" name="classId" rules={[{ required: true, message: TEXT.required }]}>
          <ClassSelect classes={classes} />
        </Form.Item>
      </Col>
      <Col xs={24} sm={14}>
        <Form.Item
          label="Bap atı"
          name="title"
          rules={[
            { required: true, message: TEXT.required },
            { max: 150, message: 'Kóbi menen 150 belgi' },
          ]}
        >
          <Input placeholder="Mısalı: 1-bap. Fonetika" autoFocus />
        </Form.Item>
      </Col>
    </Row>
    <Row gutter={16}>
      <Col xs={24} sm={12}>
        <StartTopicField chapters={chapters} editingId={editing?.id} />
      </Col>
      <Col xs={24} sm={12}>
        <Form.Item
          label="Sońǵı tema"
          name="endTopic"
          dependencies={['startTopic']}
          rules={[
            { required: true, message: TEXT.required },
            ({ getFieldValue }) => ({
              validator: async (_rule, value?: number) => {
                const start = getFieldValue('startTopic') as number | undefined;
                if (value != null && start != null && value < start) {
                  throw new Error('Baslanǵısh temadan kishi bolmawı kerek');
                }
              },
            }),
          ]}
        >
          <InputNumber min={1} style={{ width: '100%' }} placeholder="10" />
        </Form.Item>
      </Col>
    </Row>
    <Form.Item label="Túsinik" name="description" rules={[{ max: 1000, message: 'Kóbi menen 1000 belgi' }]}>
      <Input.TextArea rows={3} placeholder="Májbúriy emes" />
    </Form.Item>
  </FormModal>
);
