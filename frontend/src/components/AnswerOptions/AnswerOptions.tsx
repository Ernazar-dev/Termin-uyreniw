import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import type { AnswerOption } from '../../types/models';
import { OPTION_LETTERS } from '../../utils/constants';
import styles from './AnswerOptions.module.scss';

interface AnswerOptionsProps {
  options: AnswerOption[];
  selectedId: number | null;
  onSelect?: (optionId: number) => void;
  disabled?: boolean;
  /** When set, the correct option is highlighted and a wrong selection is marked. */
  correctId?: number | null;
}

const getStateClass = (optionId: number, selectedId: number | null, correctId?: number | null) => {
  if (correctId != null) {
    if (optionId === correctId) return styles.correct;
    if (optionId === selectedId) return styles.wrong;
    return styles.muted;
  }
  return optionId === selectedId ? styles.selected : '';
};

export const AnswerOptions = ({ options, selectedId, onSelect, disabled, correctId }: AnswerOptionsProps) => (
  <div className={styles.list} role="radiogroup">
    {options.map((option, index) => {
      const revealed = correctId != null;
      return (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={option.id === selectedId}
          disabled={disabled}
          className={`${styles.option} ${getStateClass(option.id, selectedId, correctId)}`}
          onClick={() => onSelect?.(option.id)}
        >
          <span className={styles.letter}>{OPTION_LETTERS[index]}</span>
          <span className={styles.text}>{option.text}</span>
          {revealed && option.id === correctId && <CheckCircleFilled className={styles.iconCorrect} aria-label="Durıs" />}
          {revealed && option.id === selectedId && option.id !== correctId && (
            <CloseCircleFilled className={styles.iconWrong} aria-label="Qáte" />
          )}
        </button>
      );
    })}
  </div>
);
