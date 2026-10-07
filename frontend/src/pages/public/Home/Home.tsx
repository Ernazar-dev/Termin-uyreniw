import { LearningWelcome } from '../../../components/LearningWelcome/LearningWelcome';
import StudentClasses from '../../student/Classes/Classes';
import styles from '../../../styles/page.module.scss';

/** Public entry: explore first, sign in only when submitting a test or asking AI. */
const Home = () => (
  <div className={styles.stack}>
    <LearningWelcome />
    <StudentClasses />
  </div>
);

export default Home;
