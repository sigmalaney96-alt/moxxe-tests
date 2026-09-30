import styles from '../styles/SessionClosed.module.css';

export default function SessionClosed() {
  return (
    <div className={styles.container}>
      <div className={styles.message}>
        <h1>⏹ This Session Has Closed</h1>
        <p>Your teacher has ended the session.</p>
        <p className={styles.instruction}>Please close this tab.</p>
      </div>
    </div>
  );
}
