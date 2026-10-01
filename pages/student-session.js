import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { database } from '../lib/firebase';
import { ref, get, onValue, update } from 'firebase/database';
import styles from '../styles/StudentSession.module.css';

export default function StudentSession() {
  const router = useRouter();
  const { code, teacherId, sessionId, studentId } = router.query;
  const canvasRef = useRef(null);
  
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionPaused, setSessionPaused] = useState(false);
  const [studentPaused, setStudentPaused] = useState(false);
  const [sessionClosed, setSessionClosed] = useState(false);
  const [testUrl, setTestUrl] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [canDraw, setCanDraw] = useState(true);
  const [fullscreenViolation, setFullscreenViolation] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [accessError, setAccessError] = useState('');

  useEffect(() => {
    if (!router.isReady) return;

    // Listen to session status
    const sessionRef = ref(database, `teachers/${teacherId}/sessions/${sessionId}`);
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        const session = snapshot.val();
        setSessionStarted(Boolean(session.sessionStarted));
        setSessionPaused(Boolean(session.paused));
        const assignedPlatform = session.platforms?.[0] || session.platform;
        const assignedUrl = session.platformUrls?.[assignedPlatform] || session.testUrl || '';
        const normalizedUrl = assignedUrl ? (assignedUrl.startsWith('http') ? assignedUrl : `https://${assignedUrl}`) : 'about:blank';
        setTestUrl(assignedPlatform === 'Kahoot' && session.kahootCode
          ? `https://kahoot.it/?pin=${encodeURIComponent(session.kahootCode)}`
          : normalizedUrl);

        if (session.status === 'closed') {
          setSessionClosed(true);
        }
      }
    });

    // Listen to this student's pause status
    const studentRef = ref(database, `teachers/${teacherId}/sessions/${sessionId}/students/${studentId}`);
    const studentUnsubscribe = onValue(studentRef, (snapshot) => {
      if (snapshot.exists()) {
        const student = snapshot.val();
        setStudentPaused(Boolean(student.paused));
        setCanDraw(student.canDraw !== false);
      }
    });

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && sessionStarted) setFullscreenViolation(true);
      setFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      unsubscribe();
      studentUnsubscribe();
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [router.isReady, teacherId, sessionId, studentId, sessionStarted]);

  const handleAccessCodeSubmit = (event) => {
    event.preventDefault();
    setAccessError('');
    get(ref(database, `teachers/${teacherId}/sessions/${sessionId}`)).then((snapshot) => {
      if (snapshot.val()?.accessCode === accessCode) {
        setFullscreenViolation(false);
        setAccessCode('');
        handleEnterFullscreen();
      } else {
        setAccessError('That access code is incorrect.');
      }
    });
  };

  const showSessionClosedMessage = () => {
    alert('This session has been closed. Please close the tab.');
  };

  const handleEnterFullscreen = async () => {
    setFullscreen(true);
    const elem = document.documentElement;
    if (!document.fullscreenElement && elem.requestFullscreen) {
      try {
        await elem.requestFullscreen();
      } catch (error) {
        // Browsers can reject fullscreen while embedded; the assigned test remains usable.
      }
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

  if (sessionClosed) {
    return <div className={styles.pauseOverlay}><div className={styles.pauseMessage}><h2>This session has closed</h2><p>Please close this tab.</p></div></div>;
  }

  const lockedMessage = fullscreenViolation ? (
    <div className={styles.pauseMessage}>
      <h2>You&apos;ve been caught</h2>
      <p>You left fullscreen. Ask your teacher for the 3-digit access code to resume your test.</p>
      <form onSubmit={handleAccessCodeSubmit} className={styles.accessForm}>
        <label className="sr-only" htmlFor="access-code">Teacher access code</label>
        <input id="access-code" inputMode="numeric" pattern="[0-9]{3}" maxLength="3" value={accessCode} onChange={(event) => setAccessCode(event.target.value.replace(/[^0-9]/g, '').slice(0, 3))} className={styles.accessInput} placeholder="000" required />
        <button type="submit" className={styles.accessButton}>Resume</button>
      </form>
      {accessError && <p className={styles.accessError}>{accessError}</p>}
    </div>
  ) : (
    <div className={styles.pauseMessage}>
      <h2>The Session Has Been Paused</h2>
      <p>Please wait for your teacher to resume the session.</p>
    </div>
  );

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
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerLeave={stopDrawing}
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

      <div className={styles.testContainer}>
        <p>Your assigned test is ready.</p>
        <button onClick={handleEnterFullscreen} className={styles.fullscreenBtn}>Open assigned test</button>
      </div>
      <div className={styles.fullscreenOverlay}>
        <iframe
          src={testUrl}
          className={styles.iframe}
          title="Assigned testing platform"
          allowFullScreen
          tabIndex={fullscreenViolation || sessionPaused || studentPaused || !fullscreen ? -1 : 0}
          aria-hidden={fullscreenViolation || sessionPaused || studentPaused || !fullscreen}
        />
        <div className={styles.testActions}>
          <button onClick={handleExitFullscreen} className={styles.exitFullscreenBtn}>
            Exit fullscreen
          </button>
        </div>
        {(!fullscreen || fullscreenViolation || sessionPaused || studentPaused) && (
          <div className={styles.iframeLockOverlay} role="dialog" aria-modal="true">
            {fullscreenViolation ? lockedMessage : !fullscreen ? (
              <div className={styles.pauseMessage}>
                <h2>Your assigned test is ready</h2>
                <p>Select Open assigned test to begin.</p>
              </div>
            ) : lockedMessage}
          </div>
        )}
      </div>
    </div>
  );
}
