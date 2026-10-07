import {
  AppstoreOutlined,
  BarChartOutlined,
  BookOutlined,
  FileDoneOutlined,
  PercentageOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReadOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Row, Table, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { statsApi } from '../../../api';
import { CardsSkeleton, EmptyState, ErrorState, ScoreTag, StatCard } from '../../../components';
import type { StatTone } from '../../../components/StatCard/StatCard';
import { useAuth } from '../../../hooks/useAuth';
import { useRequest } from '../../../hooks/useRequest';
import styles from '../../../styles/page.module.scss';
import type { RecentResult, TeacherStats } from '../../../types/models';
import { ROUTES } from '../../../utils/constants';
import { formatDate, formatPercent } from '../../../utils/format';
import dash from './Dashboard.module.scss';

const QUICK_ACTIONS = [
  { label: 'Termin', icon: <ReadOutlined />, path: ROUTES.teacher.terms },
  { label: 'Oyın', icon: <PlayCircleOutlined />, path: ROUTES.teacher.games },
  { label: 'Test', icon: <FileDoneOutlined />, path: ROUTES.teacher.tests },
  { label: 'Oqıwshı', icon: <TeamOutlined />, path: ROUTES.teacher.students },
];

interface CardSpec {
  label: string;
  value: number | string;
  icon: ReactNode;
  path: string;
  tone: StatTone;
}

/** Tests submitted per day — a tiny bar chart without any chart library. */
const ActivityChart = ({ activity }: { activity: TeacherStats['activity'] }) => {
  const max = Math.max(1, ...activity.map((day) => day.count));
  const total = activity.reduce((sum, day) => sum + day.count, 0);

  return (
    <Card className={dash.panel}>
      <div className={dash.panelHead}>
        <Typography.Title level={5} className={dash.panelTitle}>Sońǵı 14 kún aktivligi</Typography.Title>
        <span className={dash.badge}>{total} test</span>
      </div>
      <div className={dash.chart} role="img" aria-label={`Sońǵı 14 kúnde ${total} test tapsırıldı`}>
        {activity.map((day) => (
          <Tooltip key={day.date} title={`${dayjs(day.date).format('DD.MM')} · ${day.count} test`}>
            <div className={dash.barSlot}>
              <div
                className={`${dash.bar} ${day.count === 0 ? dash.barEmpty : ''}`}
                style={{ height: `${Math.max(6, (day.count / max) * 100)}%` }}
              />
              <span className={dash.barLabel}>{dayjs(day.date).format('D')}</span>
            </div>
          </Tooltip>
        ))}
      </div>
    </Card>
  );
};

/** Per class: how many students and how much content it has. */
const ClassBreakdown = ({ rows }: { rows: TeacherStats['classBreakdown'] }) => {
  const navigate = useNavigate();
  const maxStudents = Math.max(1, ...rows.map((row) => row.students));

  return (
    <Card className={dash.panel}>
      <div className={dash.panelHead}>
        <Typography.Title level={5} className={dash.panelTitle}>Klasslar boyınsha</Typography.Title>
        <Button type="link" size="small" onClick={() => navigate(ROUTES.teacher.classes)}>Barlıǵı</Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState plain description="Klasslar ele qosılmaǵan." />
      ) : (
        <ul className={dash.classList}>
          {rows.map((row) => (
            <li key={row.id}>
              <div className={dash.classTop}>
                <strong>{row.name}</strong>
                <span>{row.students} oqıwshı</span>
              </div>
              <div className={dash.track}>
                <div className={dash.fill} style={{ width: `${(row.students / maxStudents) * 100}%` }} />
              </div>
              <div className={dash.classMeta}>
                {row.chapters} bap · {row.terms} termin · {row.games} oyın · {row.tests} test
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useRequest(() => statsApi.teacher(), []);

  if (error) return <ErrorState message={error} onRetry={reload} />;

  const counts = data?.counts;
  const cards: CardSpec[] = counts
    ? [
        { label: 'Klasslar', value: counts.classes, icon: <AppstoreOutlined />, path: ROUTES.teacher.classes, tone: 'indigo' },
        { label: 'Baplar', value: counts.chapters, icon: <BookOutlined />, path: ROUTES.teacher.chapters, tone: 'violet' },
        { label: 'Terminler', value: counts.terms, icon: <ReadOutlined />, path: ROUTES.teacher.terms, tone: 'teal' },
        { label: 'Oyınlar', value: counts.games, icon: <PlayCircleOutlined />, path: ROUTES.teacher.games, tone: 'amber' },
        { label: 'Testler', value: counts.tests, icon: <FileDoneOutlined />, path: ROUTES.teacher.tests, tone: 'pink' },
        { label: 'Oqıwshılar', value: counts.students, icon: <TeamOutlined />, path: ROUTES.teacher.students, tone: 'indigo' },
        { label: 'Tapsırılǵan testler', value: counts.submittedTests, icon: <BarChartOutlined />, path: ROUTES.teacher.results, tone: 'green' },
        {
          label: 'Ortasha nátiyje',
          value: formatPercent(data?.averagePercentage),
          icon: <PercentageOutlined />,
          path: ROUTES.teacher.results,
          tone: 'amber',
        },
      ]
    : [];

  return (
    <div className={styles.stack}>
      <section className={dash.hero}>
        <div className={dash.heroText}>
          <span className={dash.eyebrow}>Basqarıw paneli</span>
          <h1>Sálem, {user?.fullName ?? ''}</h1>
          <p>Saytdaǵı ulıwma jaǵday</p>
        </div>
        <div className={dash.actions} aria-label="Tez qosıw">
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.path}
              icon={<PlusOutlined />}
              className={dash.actionButton}
              onClick={() => navigate(action.path, { state: { create: true } })}
            >
              {action.icon} {action.label}
            </Button>
          ))}
        </div>
      </section>

      {loading || !data ? (
        <CardsSkeleton count={8} />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {cards.map((card) => (
              <Col key={card.label} xs={24} sm={12} xl={6}>
                <StatCard
                  label={card.label}
                  value={card.value}
                  icon={card.icon}
                  tone={card.tone}
                  onClick={() => navigate(card.path)}
                />
              </Col>
            ))}
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <ActivityChart activity={data.activity} />
            </Col>
            <Col xs={24} lg={10}>
              <ClassBreakdown rows={data.classBreakdown} />
            </Col>
          </Row>

          <Card className={dash.panel}>
            <Typography.Title level={5} className={dash.panelTitle} style={{ marginBottom: 16 }}>
              Sońǵı test nátiyjeleri
            </Typography.Title>
            {data.recentResults.length === 0 ? (
              <EmptyState plain description="Házirshe hesh kim test tapsırmaǵan." />
            ) : (
              <Table<RecentResult>
                rowKey="id"
                dataSource={data.recentResults}
                pagination={false}
                scroll={{ x: 640 }}
                columns={[
                  { title: 'Oqıwshı', dataIndex: ['student', 'fullName'] },
                  { title: 'Test', dataIndex: ['test', 'title'] },
                  {
                    title: 'Bap',
                    render: (_, record) => `${record.test.chapter.class.name} · ${record.test.chapter.title}`,
                  },
                  {
                    title: 'Nátiyje',
                    render: (_, record) => (
                      <ScoreTag
                        correct={record.correctAnswers}
                        total={record.totalQuestions}
                        percentage={record.percentage}
                      />
                    ),
                  },
                  { title: 'Sáne', dataIndex: 'submittedAt', render: formatDate },
                ]}
              />
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default TeacherDashboard;
