import Link from 'next/link';
import styles from '../styles/ExitTest.module.css';

export default function ExitTest() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.warningBox}>
          <h1 className={styles.title}>⚠️ Test Paused</h1>
          <p className={styles.message}>
            You have exited the secure testing window. Your test has been paused.
          </p>
          <p className={styles.submessage}>
            For security purposes, please contact your instructor to resume your test.
          </p>
        </div>

        <div className={styles.buttonContainer}>
          <Link href="/">
            <button className={styles.button}>Return to Home</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
