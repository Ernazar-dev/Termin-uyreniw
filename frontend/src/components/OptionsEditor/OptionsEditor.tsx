import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Input, Radio, Tooltip, type FormItemProps } from 'antd';
import type { OptionPayload } from '../../types/api';
import { DEFAULT_OPTIONS_COUNT, OPTION_LETTERS, OPTIONS_MAX, OPTIONS_MIN } from '../../utils/constants';
import styles from './OptionsEditor.module.scss';

interface OptionsEditorProps {
  value?: OptionPayload[];
  onChange?: (value: OptionPayload[]) => void;
}

export const createEmptyOptions = (count = DEFAULT_OPTIONS_COUNT): OptionPayload[] =>
  Array.from({ length: count }, (_, index) => ({ text: '', isCorrect: index === 0 }));

/** Antd Form rule: 2–6 filled, unique options with exactly one correct answer. */
export const optionsRules: FormItemProps['rules'] = [
  {
    validator: async (_rule, value: OptionPayload[] | undefined) => {
      const options = value ?? [];
      if (options.length < OPTIONS_MIN) throw new Error(`Keminde ${OPTIONS_MIN} variant kerek`);
      if (options.some((option) => !option.text.trim())) throw new Error('Barlıq variantlardı toltırıń');
      const texts = options.map((option) => option.text.trim().toLowerCase());
      if (new Set(texts).size !== texts.length) throw new Error('Variantlar qaytalanbawı kerek');
      if (options.filter((option) => option.isCorrect).length !== 1) throw new Error('Bir durıs juwaptı belgileń');
    },
  },
];

/** Controlled form input: list of answer options, the radio marks the correct one. */
export const OptionsEditor = ({ value = [], onChange }: OptionsEditorProps) => {
  const update = (next: OptionPayload[]) => onChange?.(next);

  const setText = (index: number, text: string) =>
    update(value.map((option, i) => (i === index ? { ...option, text } : option)));

  const setCorrect = (index: number) =>
    update(value.map((option, i) => ({ ...option, isCorrect: i === index })));

  const remove = (index: number) => {
    const next = value.filter((_, i) => i !== index);
    if (!next.some((option) => option.isCorrect) && next[0]) next[0] = { ...next[0], isCorrect: true };
    update(next);
  };

  const add = () => update([...value, { text: '', isCorrect: value.length === 0 }]);

  return (
    <div className={styles.editor}>
      {value.map((option, index) => (
        <div key={index} className={styles.row}>
          <Tooltip title="Durıs juwap">
            <Radio
              checked={option.isCorrect}
              onChange={() => setCorrect(index)}
              aria-label={`${OPTION_LETTERS[index]} variantın durıs dep belgilew`}
            />
          </Tooltip>
          <span className={styles.letter}>{OPTION_LETTERS[index]}</span>
          <Input
            value={option.text}
            onChange={(event) => setText(index, event.target.value)}
            placeholder={`${OPTION_LETTERS[index]} variantı`}
            maxLength={500}
          />
          <Button
            type="text"
            icon={<DeleteOutlined />}
            disabled={value.length <= OPTIONS_MIN}
            onClick={() => remove(index)}
            aria-label="Variantı óshiriw"
          />
        </div>
      ))}
      {value.length < OPTIONS_MAX && (
        <Button type="dashed" icon={<PlusOutlined />} onClick={add} block>
          Variant qosıw
        </Button>
      )}
    </div>
  );
};
