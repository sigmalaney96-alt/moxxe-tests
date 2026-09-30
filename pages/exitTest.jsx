import styles from '../styles/ExitTest.module.css';

export default function ExitTest() {
  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <div className={styles.brand}>Moxee</div>
      </header>

      <section className={styles.hero}>
        <h1 className={styles.heading}>You have exited the<br />test session</h1>
      </section>

      <section className={styles.infoPanel}>
        <p className={styles.infoText}>
          Hi You have exited the Test Session with Moxee, If you accidentally pressed escape or F11 please go tell a teacher to help you reconnect!
        </p>
      </section>
    </div>
  );
}
