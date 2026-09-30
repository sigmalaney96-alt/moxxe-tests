import Link from 'next/link';
import styles from '../styles/Home.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Moxee</h1>
        <p className={styles.subtitle}>Secure Testing Made Simple</p>
        
        <div className={styles.buttonContainer}>
          <Link href="/student-login">
            <button className={styles.button}>Student Log-in</button>
          </Link>

          <Link href="/teacher-dashboard">
            <button className={styles.button + ' ' + styles.teacher}>Teacher Mode</button>
          </Link>

          <Link href="/about">
            <button className={styles.button + ' ' + styles.secondary}>About</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
