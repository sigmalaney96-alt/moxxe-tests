import Link from 'next/link';
import styles from '../styles/About.module.css';

export default function About() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>About Moxxe</h1>
        
        <div className={styles.description}>
          <p>
            Moxxe is a tool for taking tests on Cambium Assessments that opens the test in a secure window and if you exit and try to cheat it will pause the test!
          </p>
        </div>
        
        <Link href="/">
          <button className={styles.button}>Back to Home</button>
        </Link>
      </div>
    </div>
  );
}
