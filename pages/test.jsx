import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Test.module.css';

export default function Test() {
  const [showModal, setShowModal] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        router.push('/exitTest');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [router]);

  const handleStartTest = async () => {
    setShowModal(false);
    setIframeLoaded(true);

    // Request fullscreen after a small delay
    setTimeout(() => {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
    }, 300);
  };

  return (
    <div className={styles.container}>
      {showModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Start Test?</h2>
            <p>You are about to begin your test. Please ensure you are in a quiet environment and ready to proceed.</p>
            <button className={styles.startButton} onClick={handleStartTest}>
              Start Test
            </button>
          </div>
        </div>
      )}

      {iframeLoaded && (
        <iframe
          className={styles.iframe}
          src="https://mobile.tds.cambiumast.com/launchpad/"
          title="Test Platform"
          allow="fullscreen"
        />
      )}
    </div>
  );
}
