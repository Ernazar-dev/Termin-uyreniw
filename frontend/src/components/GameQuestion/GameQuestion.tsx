import { Alert, App, Card, Space, Tag, Typography } from 'antd';
import { useRef, useState } from 'react';
import { gamesApi } from '../../api';
import type { Game, GameCheckResult } from '../../types/models';
import { BLANK_MARKER, GAME_TYPE_LABELS } from '../../utils/constants';
import { getErrorMessage } from '../../utils/error';
import { AnswerOptions } from '../AnswerOptions/AnswerOptions';

interface GameQuestionProps {
  game: Game;
  answer?: GameCheckResult & { selectedId: number };
  onAnswered: (answer: GameCheckResult & { selectedId: number }) => void;
}

const BLANK_STYLE = {
  display: 'inline-block',
  minWidth: 96,
  padding: '0 8px',
  borderBottom: '2px solid currentColor',
  fontWeight: 600,
  textAlign: 'center' as const,
};

/** Renders "___" in a fill-in-the-blank question as a visible gap (or the chosen answer). */
const QuestionText = ({ game, filled }: { game: Game; filled?: string }) => {
  if (game.type !== 'FILL_BLANK') return <>{game.question}</>;
  const [before, ...rest] = game.question.split(BLANK_MARKER);
  return (
    <>
      {before}
      <span style={BLANK_STYLE}>{filled ?? ' '}</span>
      {rest.join(BLANK_MARKER)}
    </>
  );
};

/** Practice question: shows Durıs / Qáte only, no points are given. */
export const GameQuestion = ({ game, answer, onAnswered }: GameQuestionProps) => {
  const { message } = App.useApp();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const result = answer;
  const requestPending = useRef(false);
  const [checking, setChecking] = useState(false);

  const handleSelect = async (optionId: number) => {
    if (result || requestPending.current) return;
    requestPending.current = true;
    setSelectedId(optionId);
    setChecking(true);
    try {
      const checked = await gamesApi.check(game.id, optionId);
      onAnswered({ ...checked, selectedId: optionId });
    } catch (error) {
      setSelectedId(null);
      message.error(getErrorMessage(error));
    } finally {
      requestPending.current = false;
      setChecking(false);
    }
  };

  const filled = result ? game.options.find((option) => option.id === selectedId)?.text : undefined;
  const correctText = result ? game.options.find((option) => option.id === result.correctOptionId)?.text : undefined;

  return (
    <Card>
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        <Space wrap>
          <Tag color="blue">{GAME_TYPE_LABELS[game.type]}</Tag>
          {game.term && <Tag>{game.term.name}</Tag>}
        </Space>

        <Typography.Title level={4} style={{ margin: 0, lineHeight: 1.6 }}>
          <QuestionText game={game} filled={filled} />
        </Typography.Title>

        <AnswerOptions
          options={game.options}
          selectedId={selectedId}
          onSelect={handleSelect}
          disabled={Boolean(result) || checking}
          correctId={result?.correctOptionId}
        />

        {result && (
          <Alert
            type={result.isCorrect ? 'success' : 'error'}
            showIcon
            title={result.isCorrect ? 'Durıs!' : 'Qáte'}
            description={result.isCorrect ? undefined : correctText && `Durıs juwap: ${correctText}`}
          />
        )}
      </Space>
    </Card>
  );
};
