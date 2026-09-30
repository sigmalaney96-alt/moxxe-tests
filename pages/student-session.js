import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { database } from '../lib/firebase';
import { ref, onValue, update } from 'firebase/database';
import styles from '../styles/StudentSession.module.css';

export default function StudentSession() {
  const router = useRouter();
  const { code, teacherId, sessionId, studentId } = router.query;
  const canvasRef = useRef(null);
  
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionPaused, setSessionPaused] = useState(false);
  const [testUrl, setTestUrl] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [canDraw, setCanDraw] = useState(true);

  useEffect(() => {
    if (!router.isReady) return;

    // Listen to session status
    const sessionRef = ref(database, `teachers/${teacherId}/sessions/${sessionId}`);
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        const session = snapshot.val();
        setSessionStarted(session.sessionStarted || false);
        setSessionPaused(session.paused || false);

        if (session.status === 'closed') {
          showSessionClosedMessage();
        }
      }
    });

    // Listen to this student's pause status
    const studentRef = ref(database, `teachers/${teacherId}/sessions/${sessionId}/students/${studentId}`);
    const studentUnsubscribe = onValue(studentRef, (snapshot) => {
      if (snapshot.exists()) {
        const student = snapshot.val();
        setSessionPaused(student.paused || false);
        setCanDraw(student.canDraw !== false);
      }
    });

    return () => {
      unsubscribe();
      studentUnsubscribe();
    };
  }, [router.isReady, teacherId, sessionId, studentId]);

  const showSessionClosedMessage = () => {
    alert('This session has been closed. Please close the tab.');
  };

  const handleEnterFullscreen = async () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      await elem.requestFullscreen();
      setFullscreen(true);
    }
  };

  const handleExitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  // Drawing functions
  const setupCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  };

  useEffect(() => {
    setupCanvas();
  }, []);

  const startDrawing = (e) => {
    if (!canDraw) return;
    setDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e) => {
    if (!drawing || !canDraw) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  if (!router.isReady) {
    return <div className={styles.container}>Loading...</div>;
  }

  if (sessionPaused) {
    return (
      <div className={styles.pauseOverlay}>
        <div className={styles.pauseMessage}>
          <h2>⏸ The Session Has Been Paused</h2>
          <p>Please wait for your teacher to resume the session.</p>
        </div>
      </div>
    );
  }

  if (!sessionStarted) {
    return (
      <div className={styles.container}>
        <div className={styles.waitingArea}>
          <h1>✏️ Let's Draw While You Wait</h1>
          <p>The session hasn't started yet. Draw on the canvas below while we wait!</p>

          <div className={styles.drawingContainer}>
            <canvas
              ref={canvasRef}
              className={styles.canvas}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              style={{ cursor: canDraw ? 'crosshair' : 'not-allowed' }}
            />
            <button onClick={clearCanvas} className={styles.clearBtn}>
              Clear Canvas
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Session Code: {code}</h2>
        <button onClick={handleEnterFullscreen} className={styles.fullscreenBtn}>
          Enter Fullscreen
        </button>
      </div>

      {fullscreen && (
        <div className={styles.fullscreenOverlay}>
          <iframe
            src={testUrl || 'about:blank'}
            className={styles.iframe}
            title="Testing Platform"
            allowFullScreen
          />
          <button 
            onClick={handleExitFullscreen}
            className={styles.exitFullscreenBtn}
          >
            Exit Fullscreen
          </button>
        </div>
      )}

      <div className={styles.testContainer}>
        <p>Fullscreen mode is recommended for tests. Click the button above to start.</p>
      </div>
    </div>
  );
}
