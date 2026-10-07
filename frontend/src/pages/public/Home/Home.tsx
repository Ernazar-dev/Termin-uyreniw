import { lazy, Suspense } from 'react';
import { LearningWelcome } from '../../../components/LearningWelcome/LearningWelcome';
import { CardsSkeleton } from '../../../components';
import styles from '../../../styles/page.module.scss';

const StudentClasses = lazy(() => import('../../student/Classes/Classes'));

/** Public entry: explore first, sign in only when submitting a test or asking AI. */
const Home = () => (
  <div className={styles.stack}>
    <LearningWelcome />
    <Suspense fallback={<CardsSkeleton count={3} />}>
      <StudentClasses />
    </Suspense>
  </div>
);

export default Home;
