import { DeleteOutlined, FileTextOutlined, InboxOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, Form, Input, InputNumber, Radio, Row, Segmented, Select, Typography, Upload } from 'antd';
import type { UploadFile } from 'antd';
import { useState } from 'react';
import { ChapterSelect, createEmptyOptions, OptionsEditor, optionsRules } from '../../../components';
import { FormModal } from '../../../components/FormModal/FormModal';
import type { TestPayload, TestQuestionPayload } from '../../../types/api';
import type { Chapter, TestDetail } from '../../../types/models';
import { findMissingAnswers, parseAnswerKey } from '../../../utils/answerKey';
import { OPTION_LETTERS, OPTIONS_MAX, OPTIONS_MIN, TEXT } from '../../../utils/constants';

type Mode = 'file' | 'manual';

const FILE_MAX_MB = 15;
const DEFAULT_QUESTION_COUNT = 10;
const DEFAULT_FILE_OPTIONS = 4;

/** Everything the form holds; the file part is only used in `file` mode. */
interface TestFormValues extends Partial<TestPayload> {
  chapterId: number;
  title: string;
  file?: UploadFile[];
  optionCount?: number;
  questionCount?: number;
  answers?: (string | undefined)[];
}

export type TestSubmission = { mode: 'manual'; values: TestPayload } | { mode: 'file'; formData: FormData };

interface TestFormModalProps {
  open: boolean;
  editing: TestDetail | null;
  chapters: Chapter[];
  defaultChapterId?: number;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (submission: TestSubmission) => void;
}

const emptyQuestion = (): TestQuestionPayload => ({ question: '', options: createEmptyOptions() });

const letterOfCorrect = (question: TestDetail['questions'][number]) =>
  question.options.find((option) => option.isCorrect)?.text;

const toInitialValues = (test: TestDetail | null, defaultChapterId?: number): Partial<TestFormValues> => {
  // The manual question list always starts with one empty question, even while the file mode is shown
  if (!test) return { chapterId: defaultChapterId, questions: [emptyQuestion()] };
  const common = { chapterId: test.chapterId, title: test.title, description: test.description };
  if (test.fileUrl) {
    return {
      ...common,
      optionCount: test.questions[0]?.options.length ?? DEFAULT_FILE_OPTIONS,
      questionCount: test.questions.length,
      answers: test.questions.map(letterOfCorrect),
    };
  }
  return {
    ...common,
    questions: test.questions.map((question) => ({
      question: question.question,
      options: question.options.map((option) => ({ text: option.text, isCorrect: Boolean(option.isCorrect) })),
    })),
  };
};

const toFormData = (values: TestFormValues) => {
  const count = values.questionCount ?? DEFAULT_QUESTION_COUNT;
  const data = new FormData();
  data.append('chapterId', String(values.chapterId));
  data.append('title', values.title.trim());
  data.append('description', values.description?.trim() ?? '');
  data.append('optionCount', String(values.optionCount ?? DEFAULT_FILE_OPTIONS));
  data.append('answerKey', JSON.stringify(Array.from({ length: count }, (_, index) => values.answers?.[index] ?? '')));
  const file = values.file?.[0]?.originFileObj;
  if (file) data.append('file', file);
  return data;
};

/** One row per question with A / B / C / D buttons — the teacher just clicks the right letter. */
const AnswerKeyEditor = ({
  value = [],
  onChange,
  count,
  optionCount,
}: {
  value?: (string | undefined)[];
  onChange?: (value: (string | undefined)[]) => void;
  count: number;
  optionCount: number;
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
      gap: '8px 16px',
      maxHeight: 340,
      overflowY: 'auto',
      padding: '4px 4px 4px 0',
    }}
  >
    {Array.from({ length: count }, (_, index) => (
      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Typography.Text strong style={{ width: 28, textAlign: 'right' }}>
          {index + 1}.
        </Typography.Text>
        <Radio.Group
          size="small"
          optionType="button"
          buttonStyle="solid"
          value={value[index]}
          onChange={(event) => {
            const next = Array.from({ length: count }, (_, i) => value[i]);
            next[index] = event.target.value as string;
            onChange?.(next);
          }}
          options={OPTION_LETTERS.slice(0, optionCount).map((letter) => ({ value: letter, label: letter }))}
        />
      </div>
    ))}
  </div>
);

/** Fields of a ready-made PDF / Word test: the sheet, number of questions and the answer key. */
const FileTestFields = ({ editing }: { editing: TestDetail | null }) => {
  const form = Form.useFormInstance<TestFormValues>();
  const optionCount = Form.useWatch('optionCount', form) ?? DEFAULT_FILE_OPTIONS;
  const count = Form.useWatch('questionCount', form) ?? DEFAULT_QUESTION_COUNT;
  const answers = Form.useWatch('answers', form);
  const [quick, setQuick] = useState('');
  const hasStoredFile = Boolean(editing?.fileUrl);
  const filled = Array.from({ length: count }, (_, index) => answers?.[index]).filter(Boolean).length;

  const applyQuick = () => {
    const parsed = parseAnswerKey(quick);
    if (parsed.length === 0) return;
    form.setFieldValue('questionCount', Math.min(100, parsed.length));
    form.setFieldValue('answers', parsed);
    void form.validateFields(['answers']);
  };

  return (
    <Row gutter={24}>
      <Col xs={24} md={10}>
        <Form.Item
          label="Test fayli (PDF yamasa Word)"
          name="file"
          valuePropName="fileList"
          getValueFromEvent={(event: { fileList?: UploadFile[] }) => event?.fileList}
          extra={
            hasStoredFile
              ? `Házirgi fayl: ${editing?.fileName ?? ''}. Almastırıw ushın jańa fayl tańlań.`
              : `Oqıwshılar bul fayldı kóredi. PDF tuwrı sayttıń ishinde ashıladı. Kóbi menen ${FILE_MAX_MB} MB.`
          }
          rules={[
            {
              validator: async (_rule, fileList?: UploadFile[]) => {
                const file = fileList?.[0];
                if (!file && !hasStoredFile) throw new Error('Fayl júklep qoyıń');
                if (file?.size && file.size > FILE_MAX_MB * 1024 * 1024) throw new Error(`Fayl ${FILE_MAX_MB} MB tan úlken`);
              },
            },
          ]}
        >
          <Upload.Dragger accept=".pdf,.doc,.docx" maxCount={1} beforeUpload={() => false} height={150}>
            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
            <p className="ant-upload-text">Fayldı usı jerge taslań yamasa basıń</p>
          </Upload.Dragger>
        </Form.Item>
      </Col>

      <Col xs={24} md={14}>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item
              label="Sorawlar sanı"
              name="questionCount"
              initialValue={DEFAULT_QUESTION_COUNT}
              rules={[{ required: true, message: TEXT.required }]}
            >
              <InputNumber min={1} max={100} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Variantlar sanı" name="optionCount" initialValue={DEFAULT_FILE_OPTIONS}>
              <Select
                options={Array.from({ length: OPTIONS_MAX - OPTIONS_MIN + 1 }, (_, i) => OPTIONS_MIN + i).map((n) => ({
                  value: n,
                  label: `${n} (${OPTION_LETTERS[0]}–${OPTION_LETTERS[n - 1]})`,
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Tez kiritiw" extra="Mısalı: 1a 2b 3c 4d  yamasa  abcdabcd">
          <Input.Search
            value={quick}
            onChange={(event) => setQuick(event.target.value)}
            placeholder="1a 2b 3c ..."
            enterButton="Qollanıw"
            onSearch={applyQuick}
          />
        </Form.Item>

        <Form.Item
          label={`Durıs juwaplar (${filled} / ${count})`}
          name="answers"
          dependencies={['questionCount', 'optionCount']}
          rules={[
            ({ getFieldValue }) => ({
              validator: async (_rule, value?: (string | undefined)[]) => {
                const total = (getFieldValue('questionCount') as number | undefined) ?? DEFAULT_QUESTION_COUNT;
                const options = (getFieldValue('optionCount') as number | undefined) ?? DEFAULT_FILE_OPTIONS;
                const missing = findMissingAnswers(value ?? [], total, options, OPTION_LETTERS);
                if (missing.length) {
                  const shown = missing.slice(0, 8).join(', ');
                  throw new Error(`Juwap belgilenbegen sorawlar: ${shown}${missing.length > 8 ? ' ...' : ''}`);
                }
              },
            }),
          ]}
        >
          <AnswerKeyEditor count={count} optionCount={optionCount} />
        </Form.Item>
      </Col>
    </Row>
  );
};

/** Classic mode: every question and option typed by hand. */
const ManualFields = () => (
  <>
    <Typography.Title level={5}>Sorawlar</Typography.Title>
    <Form.List
      name="questions"
      rules={[
        {
          validator: async (_rule, questions?: TestQuestionPayload[]) => {
            if (!questions?.length) throw new Error('Keminde bir soraw kerek');
          },
        },
      ]}
    >
      {(fields, { add, remove }, { errors }) => (
        <>
          <Row gutter={[16, 16]}>
            {fields.map((field, index) => (
              <Col key={field.key} xs={24} lg={12}>
                <Card
                  size="small"
                  title={`${index + 1}-soraw`}
                  extra={
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      disabled={fields.length <= 1}
                      onClick={() => remove(field.name)}
                      aria-label="Sorawdı óshiriw"
                    />
                  }
                >
                  <Form.Item
                    name={[field.name, 'question']}
                    rules={[
                      { required: true, message: TEXT.required },
                      { min: 3, message: 'Keminde 3 belgi' },
                      { max: 1000, message: 'Kóbi menen 1000 belgi' },
                    ]}
                  >
                    <Input.TextArea rows={2} placeholder="Soraw teksti" />
                  </Form.Item>
                  <Form.Item name={[field.name, 'options']} rules={optionsRules} style={{ marginBottom: 0 }}>
                    <OptionsEditor />
                  </Form.Item>
                </Card>
              </Col>
            ))}
          </Row>
          <Button type="dashed" icon={<PlusOutlined />} onClick={() => add(emptyQuestion())} block style={{ marginTop: 16 }}>
            Soraw qosıw
          </Button>
          <Form.ErrorList errors={errors} />
        </>
      )}
    </Form.List>
  </>
);

export const TestFormModal = ({
  open,
  editing,
  chapters,
  defaultChapterId,
  submitting,
  onCancel,
  onSubmit,
}: TestFormModalProps) => {
  // New tests start with the faster file mode; an existing test keeps the kind it was created as.
  // Derived (not an effect) so the right fields exist from the very first render of the form.
  const [createMode, setCreateMode] = useState<Mode>('file');
  const mode: Mode = editing ? (editing.fileUrl ? 'file' : 'manual') : createMode;

  return (
    <FormModal<TestFormValues>
      open={open}
      title={editing ? 'Testti ózgertiw' : 'Jańa test'}
      submitting={submitting}
      onCancel={onCancel}
      onSubmit={(values) =>
        onSubmit(
          mode === 'file'
            ? { mode, formData: toFormData(values) }
            : {
                mode,
                values: {
                  chapterId: values.chapterId,
                  title: values.title,
                  description: values.description,
                  questions: values.questions ?? [],
                },
              },
        )
      }
      width={980}
      initialValues={toInitialValues(editing, defaultChapterId)}
    >
      {!editing && (
        <Segmented<Mode>
          block
          value={mode}
          onChange={setCreateMode}
          style={{ marginBottom: 20 }}
          options={[
            { value: 'file', label: 'Tayın fayl (PDF / Word)', icon: <FileTextOutlined /> },
            { value: 'manual', label: 'Qolda kiritiw' },
          ]}
        />
      )}

      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Form.Item label="Bap" name="chapterId" rules={[{ required: true, message: TEXT.required }]}>
            <ChapterSelect chapters={chapters} />
          </Form.Item>
        </Col>
        <Col xs={24} md={16}>
          <Form.Item
            label="Test atı"
            name="title"
            rules={[
              { required: true, message: TEXT.required },
              { min: 3, message: 'Keminde 3 belgi' },
              { max: 150, message: 'Kóbi menen 150 belgi' },
            ]}
          >
            <Input placeholder="Mısalı: Fonetika boyınsha test" />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item label="Túsinik" name="description" rules={[{ max: 1000, message: 'Kóbi menen 1000 belgi' }]}>
        <Input.TextArea rows={2} placeholder="Májbúriy emes" />
      </Form.Item>

      {mode === 'file' ? (
        <>
          {!editing && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              title="Oqıwshı fayldı kóredi hám tek A, B, C... juwaplardı belgileydi. Siz durıs juwaplardı bir ret belgileysiz."
            />
          )}
          <FileTestFields editing={editing} />
        </>
      ) : (
        <ManualFields />
      )}
    </FormModal>
  );
};
