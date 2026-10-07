import { Col, Form, Input, Radio, Row, Select } from 'antd';
import { useState } from 'react';
import { termsApi } from '../../../api';
import { ChapterSelect, createEmptyOptions, OptionsEditor, optionsRules } from '../../../components';
import { FormModal } from '../../../components/FormModal/FormModal';
import { useRequest } from '../../../hooks/useRequest';
import { useDebounce } from '../../../hooks/useDebounce';
import type { GamePayload } from '../../../types/api';
import type { Chapter, Game, GameType } from '../../../types/models';
import { BLANK_MARKER, GAME_TYPE_LABELS, TEXT } from '../../../utils/constants';

interface GameFormModalProps {
  open: boolean;
  editing: Game | null;
  chapters: Chapter[];
  defaultChapterId?: number;
  submitting: boolean;
  onCancel: () => void;
  /** Resolves to true when saved, so the modal can reset itself for the next game. */
  onSubmit: (values: GamePayload, again: boolean) => boolean | Promise<boolean> | void;
}

const MAX_TERMS_FOR_SELECT = 100;

/** Terms of the selected chapter; reloads when the chapter changes. */
const TermField = () => {
  const form = Form.useFormInstance<GamePayload>();
  const chapterId = Form.useWatch('chapterId', form);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search.trim());
  const { data, loading } = useRequest(
    () => termsApi.list({ chapterId, search: debouncedSearch || undefined, pageSize: MAX_TERMS_FOR_SELECT }),
    [chapterId, debouncedSearch],
    Boolean(chapterId),
  );

  return (
    <Form.Item label="Termin" name="termId" extra="Májbúriy emes: shınıǵıw qaysı terminge tiyisli">
      <Select
        allowClear
        loading={loading}
        disabled={!chapterId}
        placeholder={chapterId ? 'Termindi tańlań' : 'Aldın bapti tańlań'}
        options={(chapterId ? data?.items ?? [] : []).map((term) => ({ value: term.id, label: term.name }))}
        showSearch={{ filterOption: false, onSearch: setSearch }}
      />
    </Form.Item>
  );
};

const QuestionField = () => {
  const form = Form.useFormInstance<GamePayload>();
  const type = Form.useWatch('type', form) as GameType | undefined;
  const isBlank = type === 'FILL_BLANK';

  return (
    <Form.Item
      label="Soraw"
      name="question"
      extra={isBlank ? `Bos orındı «${BLANK_MARKER}» belgisi menen kórsetiń` : undefined}
      rules={[
        { required: true, message: TEXT.required },
        { min: 5, message: 'Keminde 5 belgi' },
        { max: 1000, message: 'Kóbi menen 1000 belgi' },
        {
          validator: async (_rule, value?: string) => {
            if (isBlank && value && !value.includes(BLANK_MARKER)) {
              throw new Error(`Sorawda «${BLANK_MARKER}» belgisi bolıwı kerek`);
            }
          },
        },
      ]}
    >
      <Input.TextArea
        rows={4}
        autoFocus
        placeholder={isBlank ? `${BLANK_MARKER} — hawa awız boslıǵınan tosqınlıqsız shıǵatuǵın ses.` : 'Buwın degen ne?'}
      />
    </Form.Item>
  );
};

export const GameFormModal = ({
  open,
  editing,
  chapters,
  defaultChapterId,
  submitting,
  onCancel,
  onSubmit,
}: GameFormModalProps) => {
  // After "save and add next" the chapter, type and term stay; the question and options are cleared
  const [keep, setKeep] = useState<Pick<GamePayload, 'chapterId' | 'type' | 'termId'> | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [added, setAdded] = useState(0);

  const handleSubmit = async (values: GamePayload, again: boolean) => {
    const payload = { ...values, termId: values.termId ?? null };
    const saved = await onSubmit(payload, again);
    if (again && saved) {
      setKeep({ chapterId: payload.chapterId, type: payload.type, termId: payload.termId });
      setAdded((count) => count + 1);
      setResetKey((key) => key + 1);
    }
  };

  const handleCancel = () => {
    setKeep(null);
    setAdded(0);
    onCancel();
  };

  return (
    <FormModal<GamePayload>
      open={open}
      title={editing ? 'Oyındı ózgertiw' : 'Jańa oyın'}
      submitting={submitting}
      onCancel={handleCancel}
      onSubmit={handleSubmit}
      width={940}
      resetKey={resetKey}
      continueText={editing ? undefined : 'Saqlaw hám keyingi oyın'}
      footerNote={added > 0 ? `Qosıldı: ${added} oyın` : undefined}
      initialValues={
        editing
          ? {
              chapterId: editing.chapterId,
              termId: editing.termId,
              type: editing.type,
              question: editing.question,
              options: editing.options.map((option) => ({ text: option.text, isCorrect: Boolean(option.isCorrect) })),
            }
          : {
              type: keep?.type ?? 'MULTIPLE_CHOICE',
              chapterId: keep?.chapterId ?? defaultChapterId,
              termId: keep?.termId ?? undefined,
              options: createEmptyOptions(),
            }
      }
    >
      <Row gutter={24}>
        <Col xs={24} md={11}>
          <Form.Item label="Oyın túri" name="type" rules={[{ required: true }]}>
            <Radio.Group
              optionType="button"
              options={(Object.keys(GAME_TYPE_LABELS) as GameType[]).map((type) => ({
                value: type,
                label: GAME_TYPE_LABELS[type],
              }))}
            />
          </Form.Item>
          <Form.Item label="Bap" name="chapterId" rules={[{ required: true, message: TEXT.required }]}>
            <ChapterSelect chapters={chapters} />
          </Form.Item>
          <TermField />
          <QuestionField />
        </Col>
        <Col xs={24} md={13}>
          <Form.Item label="Variantlar (durıs juwaptı belgileń)" name="options" rules={optionsRules}>
            <OptionsEditor />
          </Form.Item>
        </Col>
      </Row>
    </FormModal>
  );
};
