import { RobotOutlined, SendOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, Input, Spin, Tag, Typography } from 'antd';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { aiApi } from '../../../api';
import { useAuth } from '../../../hooks/useAuth';
import { useActivityEntry } from '../../../hooks/useActivityEntry';
import { PageHeader } from '../../../components';
import { ActivityRoute } from '../../../routes/ActivityRoute';
import type { AnswerSource, AssistantAnswer } from '../../../types/models';
import { ROUTES, TEXT } from '../../../utils/constants';
import { getErrorMessage } from '../../../utils/error';
import styles from './AIChat.module.scss';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  source?: AnswerSource | 'error';
  term?: AssistantAnswer['term'];
}

const EXAMPLES = ['Frazeologizm degen ne?', 'Sinonim degen ne?', 'Metafora degen ne?'];

const SOURCE_TAGS: Partial<Record<NonNullable<ChatMessage['source']>, { color: string; label: string }>> = {
  database: { color: 'green', label: 'Platformadaǵı termin' },
  ai: { color: 'blue', label: 'Járdemshi juwabı' },
};

const MAX_QUESTION_LENGTH = 500;

/** AI answers use **bold** markers; render them without pulling in a markdown library. */
const renderAnswer = (text: string) =>
  text.split(/\*\*(.+?)\*\*/g).map((part, index) => (index % 2 === 1 ? <strong key={index}>{part}</strong> : part));

const StudentAIChat = () => {
  const { user } = useAuth();
  const enterActivity = useActivityEntry();
  const location = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(() => (location.state as { question?: string } | null)?.question ?? '');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const append = (message: Omit<ChatMessage, 'id'>) =>
    setMessages((current) => [...current, { ...message, id: nextId.current++ }]);

  const send = async (text = input) => {
    const question = text.trim();
    if (!question || sending) return;
    if (!user) { enterActivity(ROUTES.student.ai, TEXT.aiLoginHint); return; }

    append({ role: 'user', content: question });
    setInput('');
    setSending(true);
    try {
      const response = await aiApi.ask(question);
      append({ role: 'assistant', content: response.answer, source: response.source, term: response.term });
    } catch (error) {
      append({ role: 'assistant', content: getErrorMessage(error), source: 'error' });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  };

  if (!user) {
    return (
      <div className={styles.page}>
        <PageHeader
          title="Aqıllı járdemshi"
          subtitle="Platformadan tappaǵan terminiń haqqında qaraqalpaq tilinde soraw beriń"
        />
        <ActivityRoute
          description={TEXT.aiLoginHint}
          backTo={ROUTES.home}
          backLabel="Bas betke qaytıw"
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Aqıllı járdemshi"
        subtitle="Platformadan tappaǵan terminiń haqqında qaraqalpaq tilinde soraw beriń"
      />

      <Card className={styles.chat} styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } }}>
        <div className={styles.messages} ref={listRef} aria-live="polite">
          {messages.length === 0 && (
            <div className={styles.intro}>
              <RobotOutlined className={styles.introIcon} />
              <Typography.Title level={3} style={{ marginTop: 0 }}>Birge úyrenemiz</Typography.Title>
              <Typography.Paragraph type="secondary">
                Mısalı, tómendegi sorawlardıń birin beriń:
              </Typography.Paragraph>
              <div className={styles.examples}>
                {EXAMPLES.map((example) => (
                  <Button key={example} onClick={() => void send(example)}>
                    {example}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => {
            const sourceTag = message.source ? SOURCE_TAGS[message.source] : undefined;
            return (
              <div
                key={message.id}
                className={`${styles.message} ${message.role === 'user' ? styles.user : styles.assistant}`}
              >
                <Avatar
                  size={32}
                  icon={message.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                  className={styles.avatar}
                />
                <div className={`${styles.bubble} ${message.source === 'error' ? styles.error : ''}`}>
                  {sourceTag && (
                    <Tag color={sourceTag.color} className={styles.sourceTag}>
                      {sourceTag.label}
                    </Tag>
                  )}
                  <div className={styles.text}>
                    {message.role === 'assistant' ? renderAnswer(message.content) : message.content}
                  </div>
                  {message.term && (
                    <Link to={ROUTES.student.term(message.term.id)} className={styles.termLink}>
                      «{message.term.name}» terminine ótiw →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}

          {sending && (
            <div className={`${styles.message} ${styles.assistant}`}>
              <Avatar size={32} icon={<RobotOutlined />} className={styles.avatar} />
              <div className={styles.bubble}>
                <Spin size="small" /> <Typography.Text type="secondary">Juwap tayarlanbaqta...</Typography.Text>
              </div>
            </div>
          )}
        </div>

        <div className={styles.composer}>
          <Input.TextArea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Sorawıńızdı jazıń..."
            autoSize={{ minRows: 1, maxRows: 4 }}
            maxLength={MAX_QUESTION_LENGTH}
            aria-label="Soraw"
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            aria-label="Jiberiw"
            loading={sending}
            disabled={!input.trim()}
            onClick={() => void send()}
          >
            <span className={styles.sendLabel}>Jiberiw</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default StudentAIChat;
