import { useState } from 'react';
import { useRouter } from 'next/router';
import { database } from '../lib/firebase';
import { ref, get, push } from 'firebase/database';
import { setStudentSession } from '../lib/sessionUtils';
import styles from '../styles/StudentLogin.module.css';

export default function StudentLogin() {
  const [studentName, setStudentName] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleJoinSession = async (e) => {
    e.preventDefault();
    setError('');
    const safeStudentName = studentName.replace(/[\\p{Extended_Pictographic}\\uFE0F\\u200D]/gu, '').replace(/\\s+/g, ' ').trim();
    if (!safeStudentName) {
      setError('Please enter a nickname without emojis.');
      return;
    }
    setLoading(true);

    try {
      if (!studentName || !sessionCode) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      // Find the session by code
      const teachersRef = ref(database, 'teachers');
      const snapshot = await get(teachersRef);
      
      let foundSession = null;
      let foundTeacherId = null;
      let foundSessionId = null;

      if (snapshot.exists()) {
        const teachers = snapshot.val();
        for (const teacherId in teachers) {
          if (teachers[teacherId].sessions) {
            for (const sessionId in teachers[teacherId].sessions) {
              if (teachers[teacherId].sessions[sessionId].code === sessionCode.toUpperCase()) {
                foundSession = teachers[teacherId].sessions[sessionId];
                foundTeacherId = teacherId;
                foundSessionId = sessionId;
                break;
              }
            }
          }
        }
      }

      if (!foundSession) {
        setError('Session code not found');
        setLoading(false);
        return;
      }

      if (foundSession.status === 'closed') {
        setError('This session has been closed');
        setLoading(false);
        return;
      }

      // Add student to session
      const studentData = {
        name: safeStudentName,
        joinedAt: new Date().toISOString(),
        paused: false,
        canDraw: true
      };

      const studentsRef = ref(database, `teachers/${foundTeacherId}/sessions/${foundSessionId}/students`);
      const newStudentRef = await push(studentsRef, studentData);

      // Store session info
      setStudentSession(sessionCode.toUpperCase(), studentName);
      
      // Redirect to student session
      router.push(`/student-session?code=${sessionCode.toUpperCase()}&teacherId=${foundTeacherId}&sessionId=${foundSessionId}&studentId=${newStudentRef.key}`);
    } catch (err) {
      setError('Error joining session: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Join a Session</h1>
        <p>Enter your name and session code to join your teacher's session</p>

        <form onSubmit={handleJoinSession} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Your Name (Nickname)</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, ''))}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Session Code</label>
            <input
              type="text"
              placeholder="Enter 6-character code"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
              maxLength="6"
              className={styles.input}
              required
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            className={styles.joinBtn}
          >
            {loading ? 'Joining...' : 'Join Session'}
          </button>
        </form>

        <button 
          onClick={() => window.history.back()}
          className={styles.backBtn}
        >
          Back
        </button>
      </div>
    </div>
  );
}
