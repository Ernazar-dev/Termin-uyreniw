import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { App, Button, Card, Progress, Radio, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { testsApi } from '../../../api';
import { ContentSkeleton, EmptyState, ErrorState, PageHeader, TestQuestion } from '../../../components';
import { useRequest } from '../../../hooks/useRequest';
import styles from '../../../styles/page.module.scss';
import type { TestDetail } from '../../../types/models';
import { ROUTES } from '../../../utils/constants';
import { getErrorMessage } from '../../../utils/error';
import { useAuth } from '../../../hooks/useAuth';
import { useActivityEntry } from '../../../hooks/useActivityEntry';
import { ActivityRoute } from '../../../routes/ActivityRoute';
import { TestDocument } from './TestDocument';
import sheet from './TestPlay.module.scss';
import { readTestDraft, testDraftKey } from '../../../utils/testDraft';


interface AnswerSheetProps {
  test: TestDetail;
  answers: Record<number, number>;
  onSelect: (questionId: number, optionId: number) => void;
  submitting: boolean;
  onSubmit: () => void;
}

/** Only the answer letters: the student reads the sheet and ticks A, B, C ... for every number. */
const AnswerSheet = ({ test, answers, onSelect, submitting, onSubmit }: AnswerSheetProps) => {
  const total = test.questions.length;
  const answered = Object.keys(answers).length;

  return (
    <Card className={sheet.sheetCard}>
      <Typography.Title level={5} style={{ marginTop: 0 }}>
        Juwaplar
      </Typography.Title>
      <Progress percent={Math.round((answered / total) * 100)} size="small" format={() => `${answered}/${total}`} />
      <div className={sheet.rows} role="list">
        {test.questions.map((question, index) => (
          <div key={question.id} className={sheet.row} role="listitem">
            <span className={sheet.number}>{index + 1}</span>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={answers[question.id]}
              onChange={(event) => onSelect(question.id, event.target.value as number)}
              options={question.options.map((option) => ({ value: option.id, label: option.text }))}
              aria-label={`${index + 1}-soraw`}
            />
          </div>
        ))}
      </div>
      <Button type="primary" size="large" block loading={submitting} onClick={onSubmit} className={sheet.submit}>
        Testti tapsırıw
      </Button>
    </Card>
  );
};

const TestSession = ({ id }: { id: number }) => {
  const { user } = useAuth();
  const enterActivity = useActivityEntry();
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const [index, setIndex] = useState(0);
  const draftKey = testDraftKey(id, user?.id);
  const [answers, setAnswers] = useState<Record<number, number>>(() => {
    const own = readTestDraft(draftKey);
    if (Object.keys(own).length || !user) return own;
    return readTestDraft(testDraftKey(id));
  });
  const [submitting, setSubmitting] = useState(false);
  const { data, loading, error, reload } = useRequest(() => (user ? testsApi.get(id) : Promise.reject(new Error('Auth required'))), [id, user]);

  useEffect(() => {
    if (!user) return;
    try {
      sessionStorage.setItem(draftKey, JSON.stringify({ at: Date.now(), answers }));
      sessionStorage.removeItem(testDraftKey(id));
    } catch { /* Storage can be unavailable. */ }
  }, [answers, draftKey, id, user]);

  if (!user) {
    return (
      <ActivityRoute
        description="Testti baslaw hám nátiyjeńizdi saqlaw ushın akkauntıńızǵa kiriń."
        backTo={ROUTES.student.tests}
        backLabel="Testler dizimine qaytıw"
      />
    );
  }

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !data) return <ContentSkeleton />;

  const header = (
    <PageHeader
      title={data.title}
      subtitle={`${data.chapter.class.name} · ${data.chapter.title}`}
      back={ROUTES.student.tests}
    />
  );

  if (data.questions.length === 0) {
    return (
      <>
        {header}
        <EmptyState description="Bul testte ele sorawlar joq." />
      </>
    );
  }

  const total = data.questions.length;
  const question = data.questions[index];
  const validAnswers = Object.fromEntries(data.questions.flatMap((item) =>
    item.options.some((option) => option.id === answers[item.id]) ? [[item.id, answers[item.id]]] : [],
  ));
  const answeredCount = Object.keys(validAnswers).length;
  const isLast = index === total - 1;

  const submit = async () => {
    setSubmitting(true);
    try {
      const result = await testsApi.submit(id, {
        answers: data.questions.map((item) => ({ questionId: item.id, optionId: validAnswers[item.id] ?? null })),
      });
      try { sessionStorage.removeItem(draftKey); } catch { /* optional storage */ }
      navigate(ROUTES.student.result(result.id), { replace: true });
    } catch (submitError) {
      message.error(getErrorMessage(submitError));
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (!user) {
      enterActivity(ROUTES.student.test(id), 'Test nátiyjesin saqlaw ushın kiriń yamasa dizimnen ótiń.');
      return;
    }
    if (user.role !== 'STUDENT') { message.info('Testti oqıwshı akkauntı menen tapsırıń.'); return; }
    const unanswered = total - answeredCount;
    modal.confirm({
      title: 'Testti tapsırasız ba?',
      content:
        unanswered > 0
          ? `${unanswered} sorawǵa juwap berilmegen. Olar qáte dep esaplanadı.`
          : 'Tapsırǵannan keyin juwaplardı ózgertiw múmkin emes.',
      okText: 'Tapsırıw',
      cancelText: 'Biykarlaw',
      centered: true,
      onOk: submit,
    });
  };

  // Ready-made PDF / Word test: the sheet on the left, the answer letters on the right
  if (data.fileUrl) {
    return (
      <div className={styles.stack}>
        {header}
        {data.description && <Typography.Paragraph type="secondary">{data.description}</Typography.Paragraph>}
        <div className={sheet.layout}>
          <TestDocument test={data} />
          <AnswerSheet
            test={data}
            answers={validAnswers}
            onSelect={(questionId, optionId) => setAnswers((current) => ({ ...current, [questionId]: optionId }))}
            submitting={submitting}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.stack}>
      {header}
      <div className={styles.workspace}>
      <div className={styles.stack}>
      <div>
        <Typography.Text type="secondary">
          Juwap berildi: {answeredCount} / {total}
        </Typography.Text>
        <Progress percent={Math.round((answeredCount / total) * 100)} size="small" />
      </div>

      <TestQuestion
        question={question}
        index={index}
        total={total}
        selectedId={validAnswers[question.id] ?? null}
        onSelect={(optionId) => setAnswers((current) => ({ ...current, [question.id]: optionId }))}
      />

      <div className={styles.actions}>
        <Button icon={<LeftOutlined />} disabled={index === 0} onClick={() => setIndex(index - 1)}>
          Aldınǵı
        </Button>
        {isLast ? (
          <Button type="primary" loading={submitting} onClick={handleSubmit}>
            Testti tapsırıw
          </Button>
        ) : (
          <Button type="primary" onClick={() => setIndex(index + 1)}>
            Keyingi <RightOutlined />
          </Button>
        )}
      </div>
      </div>
      <aside className={styles.sidePanel}>
        <Typography.Title level={5} className={styles.sectionTitle}>Sorawlar</Typography.Title>
        <Typography.Text type="secondary">{answeredCount} / {total} juwap berildi</Typography.Text>
        <nav className={styles.questionNav} aria-label="Test sorawları">
          {data.questions.map((item, position) => (
            <Button key={item.id} type={position === index ? 'primary' : 'default'}
              style={position !== index && validAnswers[item.id] ? { background: '#e8f7ee', borderColor: '#16a34a' } : undefined}
              aria-current={position === index ? 'step' : undefined}
              aria-label={`${position + 1}-soraw${validAnswers[item.id] ? ', juwap berildi' : ''}`}
              onClick={() => setIndex(position)}>{position + 1}</Button>
          ))}
        </nav>
        <Typography.Paragraph type="secondary">Soraw nomerin basıp, oǵan tikkeley ótiń.</Typography.Paragraph>
        <Button block loading={submitting} onClick={handleSubmit}>Testti tapsırıw</Button>
      </aside>
      </div>
    </div>
  );
};

const StudentTestPlay = () => {
  const { testId } = useParams();
  const { user } = useAuth();
  return <TestSession key={`${testId}:${user?.id ?? 'guest'}`} id={Number(testId)} />;
};

export default StudentTestPlay;
