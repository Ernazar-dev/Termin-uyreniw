import { ReloadOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Card, Progress, Result, Tag, Typography } from 'antd';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { gamesApi } from '../../../api';
import { ContentSkeleton, EmptyState, ErrorState, GameQuestion, PageHeader } from '../../../components';
import { useRequest } from '../../../hooks/useRequest';
import styles from '../../../styles/page.module.scss';
import type { GameCheckResult } from '../../../types/models';
import { ROUTES } from '../../../utils/constants';

const GameSession = ({ id }: { id: number }) => {
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [answers, setAnswers] = useState<Record<number, GameCheckResult & { selectedId: number }>>({});
  const { data, loading, error, reload } = useRequest(() => gamesApi.list({ chapterId: id }), [id]);
  const game = data?.[index];
  const currentAnswer = game ? answers[game.id] : undefined;

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !data) return <ContentSkeleton />;

  const chapter = data[0]?.chapter;
  const header = (
    <PageHeader
      title="Interaktiv shınıǵıwlar"
      subtitle={chapter ? `${chapter.class.name} · ${chapter.title}` : undefined}
      back={ROUTES.student.chapter(id)}
    />
  );

  if (data.length === 0) {
    return (
      <>
        {header}
        <EmptyState description="Oyın qosılmaǵan." />
      </>
    );
  }

  const isLast = index === data.length - 1;
  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.values(answers).filter(answer => answer.isCorrect).length;
  const restart = () => {
    setAnswers({});
    setIndex(0);
    setAttempt(value => value + 1);
  };

  if (index >= data.length) return (
    <div className={`${styles.stack} ${styles.narrow}`}>
      {header}
      <Card>
        <Result status={correctCount === data.length ? 'success' : 'info'}
          title="Shınıǵıwlar tamamlandı!"
          subTitle={`${data.length} sorawdan ${correctCount} durıs, ${data.length - correctCount} qáte.`}
          extra={[
            <Button key="replay" type="primary" icon={<ReloadOutlined />} onClick={restart}>Qayta oynaw</Button>,
            <Link key="catalog" to={ROUTES.student.games}><Button>Shınıǵıwlarǵa qaytıw</Button></Link>,
          ]} />
        <Progress percent={Math.round(correctCount / data.length * 100)} />
        <Typography.Paragraph type="secondary">Nátiyjeni jaqsılaw ushın barlıq sorawlardı qaytadan sheshiń.</Typography.Paragraph>
      </Card>
      <div className={styles.stackSm}>
        {data.map((item, position) => {
          const answer = answers[item.id];
          return (
            <Card key={item.id} size="small">
              <Tag color={answer?.isCorrect ? 'green' : 'red'}>{answer?.isCorrect ? 'Durıs' : 'Qáte'}</Tag>
              <Typography.Text strong>{position + 1}. {item.question}</Typography.Text>
              <Typography.Paragraph style={{ margin: '8px 0 0' }}>
                Sizdiń juwabıńız: {item.options.find(option => option.id === answer?.selectedId)?.text}
              </Typography.Paragraph>
              {!answer?.isCorrect && <Typography.Text type="secondary">
                Durıs juwap: {item.options.find(option => option.id === answer?.correctOptionId)?.text}
              </Typography.Text>}
            </Card>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={`${styles.stack} ${styles.narrow}`}>
      {header}
      <div>
        <Typography.Text type="secondary">
          Shınıǵıw {index + 1} / {data.length}
        </Typography.Text>
        <Progress percent={Math.round((answeredCount / data.length) * 100)} showInfo={false} size="small" />
      </div>

      <GameQuestion key={`${attempt}:${game!.id}`} game={game!} answer={currentAnswer}
        onAnswered={answer => setAnswers(current => current[game!.id] ? current : { ...current, [game!.id]: answer })} />

      <div className={styles.actions}>
        <Typography.Text type="secondary" aria-live="polite">
          {currentAnswer ? 'Juwap saqlandı. Dawam etiw ushın tómendegi túymeni basıń.' : 'Bir juwaptı tańlań. Juwaptı ózgertiw múmkin emes.'}
        </Typography.Text>
        <Button type="primary" disabled={!currentAnswer} onClick={() => setIndex(index + 1)}>
          {isLast ? 'Nátiyjeni kóriw' : 'Keyingi'} <RightOutlined />
        </Button>
      </div>
    </div>
  );
};

const StudentGamePlay = () => {
  const { chapterId } = useParams();
  return <GameSession key={chapterId} id={Number(chapterId)} />;
};

export default StudentGamePlay;
