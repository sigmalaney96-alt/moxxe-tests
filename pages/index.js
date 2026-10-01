import { useRouter } from 'next/router';
import { isTeacherLoggedIn } from '../lib/sessionUtils';
import styles from '../styles/Home.module.css';

export default function Home() {
  const router = useRouter();

  const handleTeacherMode = () => {
    if (isTeacherLoggedIn()) {
      router.push('/teacher-dashboard');
    } else {
      router.push('/teacher-auth');
    }
  };

  const handleStudentMode = () => {
    router.push('/student-login');
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1>Moxxe - Secure Testing Platform</h1>
        <p>Take tests securely with real-time monitoring</p>

        <div className={styles.buttonContainer}>
          <button className={styles.primaryBtn} onClick={handleTeacherMode}>
            👨‍🏫 Teacher Mode
          </button>
          <button className={styles.secondaryBtn} onClick={handleStudentMode}>
            👨‍🎓 Student Mode
          </button>
        </div>

        <div className={styles.infoContainer}>
          <h2>About Moxxe</h2>
          <p>
            Moxxe is a secure testing platform that ensures academic integrity by monitoring 
            student activity during assessments. Teachers can manage sessions, pause tests, 
            and monitor multiple students in real-time.
          </p>
        </div>
      </main>
    </div>
  );
}
