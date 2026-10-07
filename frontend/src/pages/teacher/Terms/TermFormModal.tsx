import { Col, Form, Input, Row } from 'antd';
import { useState } from 'react';
import { ChapterSelect, ClassSelect } from '../../../components';
import { FormModal } from '../../../components/FormModal/FormModal';
import { ImageInput, type ImageValue } from '../../../components/ImageInput/ImageInput';
import type { Chapter, ClassItem, Term } from '../../../types/models';
import { TEXT } from '../../../utils/constants';

export interface TermFormValues {
  name: string;
  definition: string;
  example?: string;
  classId?: number;
  chapterId: number;
  image?: ImageValue;
}

interface TermFormModalProps {
  open: boolean;
  editing: Term | null;
  classes: ClassItem[];
  chapters: Chapter[];
  submitting: boolean;
  onCancel: () => void;
  /** Resolves to true when saved, so the modal can reset itself for the next term. */
  onSubmit: (formData: FormData, again: boolean) => boolean | Promise<boolean> | void;
}

/** Converts form values to multipart data; `removeImage` tells the API to drop the old image. */
const toFormData = (values: TermFormValues, editing: Term | null) => {
  const data = new FormData();
  data.append('chapterId', String(values.chapterId));
  data.append('name', values.name.trim());
  data.append('definition', values.definition.trim());
  data.append('example', values.example?.trim() ?? '');

  const image = values.image;
  if (image?.file) data.append('image', image.file);
  if (editing?.image && !image?.file && !image?.existing) data.append('removeImage', 'true');
  return data;
};

/** Chapter list depends on the selected class. */
const ChapterField = ({ chapters }: { chapters: Chapter[] }) => {
  const form = Form.useFormInstance<TermFormValues>();
  const classId = Form.useWatch('classId', form);

  return (
    <Form.Item label="Bap" name="chapterId" rules={[{ required: true, message: TEXT.required }]}>
      <ChapterSelect chapters={chapters} classId={classId} />
    </Form.Item>
  );
};

export const TermFormModal = ({
  open,
  editing,
  classes,
  chapters,
  submitting,
  onCancel,
  onSubmit,
}: TermFormModalProps) => {
  // After "save and add next" the class / chapter stay selected; the rest is cleared
  const [keep, setKeep] = useState<Partial<Pick<TermFormValues, "classId" | "chapterId">>>({});
  const [resetKey, setResetKey] = useState(0);
  const [added, setAdded] = useState(0);

  const handleSubmit = async (values: TermFormValues, again: boolean) => {
    const saved = await onSubmit(toFormData(values, editing), again);
    if (again && saved) {
      setKeep({ classId: values.classId, chapterId: values.chapterId });
      setAdded((count) => count + 1);
      setResetKey((key) => key + 1);
    }
  };

  const handleCancel = () => {
    setKeep({});
    setAdded(0);
    onCancel();
  };

  return (
    <FormModal<TermFormValues>
      open={open}
      title={editing ? 'Termindi ózgertiw' : 'Jańa termin'}
      submitting={submitting}
      onCancel={handleCancel}
      onSubmit={handleSubmit}
      width={900}
      resetKey={resetKey}
      continueText={editing ? undefined : 'Saqlaw hám keyingisin qosıw'}
      footerNote={added > 0 ? `Qosıldı: ${added}` : undefined}
      initialValues={
        editing
          ? {
              name: editing.name,
              definition: editing.definition,
              example: editing.example ?? undefined,
              classId: editing.chapter.classId,
              chapterId: editing.chapterId,
              image: { file: null, existing: editing.image },
            }
          : { ...keep, image: { file: null, existing: null } }
      }
    >
      <Row gutter={24}>
        <Col xs={24} md={14}>
          <Form.Item
            label="Termin atı"
            name="name"
            rules={[
              { required: true, message: TEXT.required },
              { min: 2, message: 'Keminde 2 belgi' },
              { max: 150, message: 'Kóbi menen 150 belgi' },
            ]}
          >
            <Input placeholder="Mısalı: Fonetika" autoFocus />
          </Form.Item>
          <Form.Item
            label="Mánisi"
            name="definition"
            rules={[
              { required: true, message: TEXT.required },
              { min: 5, message: 'Keminde 5 belgi' },
              { max: 3000, message: 'Kóbi menen 3000 belgi' },
            ]}
          >
            <Input.TextArea rows={5} showCount maxLength={3000} />
          </Form.Item>
          <Form.Item label="Mısal" name="example" rules={[{ max: 2000, message: 'Kóbi menen 2000 belgi' }]}>
            <Input.TextArea rows={2} placeholder="Májbúriy emes" />
          </Form.Item>
        </Col>
        <Col xs={24} md={10}>
          <Form.Item label="Klass" name="classId">
            <ClassSelect classes={classes} allowClear />
          </Form.Item>
          <ChapterField chapters={chapters} />
          <Form.Item label="Súwret" name="image">
            <ImageInput />
          </Form.Item>
        </Col>
      </Row>
    </FormModal>
  );
};
