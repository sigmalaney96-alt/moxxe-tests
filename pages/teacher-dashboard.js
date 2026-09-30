import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { database, auth } from '../lib/firebase';
import { ref, push, onValue, update, remove } from 'firebase/database';
import { signOut } from 'firebase/auth';
import { getTeacherCookie, removeTeacherCookie, generateSessionCode, isTeacherLoggedIn } from '../lib/sessionUtils';
import styles from '../styles/Dashboard.module.css';

const TESTING_PLATFORMS = ['Kahoot', 'Cambium Assessment', 'Pear Deck'];

export default function TeacherDashboard() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [loading, setLoading] = useState(false);
  const [teacherEmail, setTeacherEmail] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionStudents, setSessionStudents] = useState([]);
  const [showSessionControl, setShowSessionControl] = useState(false);
  const [sessionPaused, setSessionPaused] = useState(false);

  useEffect(() => {
    if (!isTeacherLoggedIn()) {
      router.push('/teacher-auth');
      return;
    }

    const cookie = getTeacherCookie();
    setTeacherEmail(cookie.email);

    // Load teacher's sessions
    const sessionsRef = ref(database, `teachers/${cookie.uid}/sessions`);
    const unsubscribe = onValue(sessionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const sessionList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setSessions(sessionList);
      } else {
        setSessions([]);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleCreateSession = async () => {
    if (!sessionName || !selectedPlatform) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const cookie = getTeacherCookie();
      const sessionCode = generateSessionCode();
      
      const sessionData = {
        name: sessionName,
        platform: selectedPlatform,
        code: sessionCode,
        createdAt: new Date().toISOString(),
        status: 'active',
        paused: false,
        students: {}
      };

      const sessionsRef = ref(database, `teachers/${cookie.uid}/sessions`);
      await push(sessionsRef, sessionData);

      setSessionName('');
      setSelectedPlatform('');
      setShowCreateModal(false);
    } catch (error) {
      alert('Error creating session: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSession = (session) => {
    setSelectedSession(session);
    setShowSessionControl(true);
    setSessionPaused(session.paused || false);

    // Load students in session
    const cookie = getTeacherCookie();
    const studentsRef = ref(database, `teachers/${cookie.uid}/sessions/${session.id}/students`);
    onValue(studentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const studentList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setSessionStudents(studentList);
      } else {
        setSessionStudents([]);
      }
    });
  };

  const handlePauseAll = async () => {
    if (!selectedSession) return;
    
    const cookie = getTeacherCookie();
    const sessionRef = ref(database, `teachers/${cookie.uid}/sessions/${selectedSession.id}`);
    await update(sessionRef, { paused: true });
    setSessionPaused(true);
  };

  const handleResumeAll = async () => {
    if (!selectedSession) return;
    
    const cookie = getTeacherCookie();
    const sessionRef = ref(database, `teachers/${cookie.uid}/sessions/${selectedSession.id}`);
    await update(sessionRef, { paused: false });
    setSessionPaused(false);
  };

  const handlePauseStudent = async (studentId) => {
    if (!selectedSession) return;
    
    const cookie = getTeacherCookie();
    const studentRef = ref(database, `teachers/${cookie.uid}/sessions/${selectedSession.id}/students/${studentId}`);
    await update(studentRef, { paused: true });
  };

  const handleStopSession = async () => {
    if (!selectedSession) return;
    
    const cookie = getTeacherCookie();
    const sessionRef = ref(database, `teachers/${cookie.uid}/sessions/${selectedSession.id}`);
    await update(sessionRef, { status: 'closed' });
    
    setShowSessionControl(false);
    setSelectedSession(null);
  };

  const handleLogout = async () => {
    await signOut(auth);
    removeTeacherCookie();
    router.push('/');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Teacher Dashboard</h1>
        <div className={styles.headerRight}>
          <span>{teacherEmail}</span>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Sessions</h2>
            <button 
              onClick={() => setShowCreateModal(true)}
              className={styles.primaryBtn}
            >
              + Start New Session
            </button>
          </div>

          {sessions.length === 0 ? (
            <p className={styles.empty}>No sessions yet. Create one to get started!</p>
          ) : (
            <div className={styles.sessionGrid}>
              {sessions.map(session => (
                <div 
                  key={session.id} 
                  className={`${styles.sessionCard} ${session.status === 'closed' ? styles.closed : ''}`}
                  onClick={() => handleSelectSession(session)}
                >
                  <h3>{session.name}</h3>
                  <p className={styles.platform}>{session.platform}</p>
                  <p className={styles.code}>Code: <strong>{session.code}</strong></p>
                  <p className={styles.status}>{session.status}</p>
                  <p className={styles.studentCount}>
                    {Object.keys(session.students || {}).length} students
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Create New Session</h2>
            
            <input
              type="text"
              placeholder="Session Name"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className={styles.input}
            />

            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className={styles.select}
            >
              <option value="">Select Testing Platform</option>
              {TESTING_PLATFORMS.map(platform => (
                <option key={platform} value={platform}>{platform}</option>
              ))}
            </select>

            <div className={styles.modalButtons}>
              <button 
                onClick={handleCreateSession}
                disabled={loading}
                className={styles.primaryBtn}
              >
                {loading ? 'Creating...' : 'Create Session'}
              </button>
              <button 
                onClick={() => setShowCreateModal(false)}
                className={styles.secondaryBtn}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Control Panel */}
      {showSessionControl && selectedSession && (
        <div className={styles.modal}>
          <div className={styles.sessionControlPanel}>
            <h2>{selectedSession.name}</h2>
            <p>Session Code: <strong>{selectedSession.code}</strong></p>
            <p>Status: <strong>{selectedSession.status}</strong></p>

            <div className={styles.controlButtons}>
              {!sessionPaused ? (
                <button onClick={handlePauseAll} className={styles.pauseBtn}>
                  ⏸ Pause All Students
                </button>
              ) : (
                <button onClick={handleResumeAll} className={styles.resumeBtn}>
                  ▶ Resume All Students
                </button>
              )}
              
              <button onClick={handleStopSession} className={styles.stopBtn}>
                ⏹ Stop Session
              </button>
            </div>

            <div className={styles.studentList}>
              <h3>Students in Session ({sessionStudents.length})</h3>
              {sessionStudents.map(student => (
                <div key={student.id} className={styles.studentItem}>
                  <span>{student.name}</span>
                  <button 
                    onClick={() => handlePauseStudent(student.id)}
                    className={styles.pauseStudentBtn}
                    disabled={student.paused}
                  >
                    {student.paused ? '✓ Paused' : 'Pause'}
                  </button>
                </div>
              ))}
            </div>

            <button 
              onClick={() => {
                setShowSessionControl(false);
                setSelectedSession(null);
              }}
              className={styles.closeBtn}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
