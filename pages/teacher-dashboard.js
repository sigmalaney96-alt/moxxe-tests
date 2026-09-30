import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { database, auth } from '../lib/firebase';
import { onValue, push, ref, update } from 'firebase/database';
import { signOut } from 'firebase/auth';
import { getTeacherCookie, generateSessionCode, isTeacherLoggedIn, removeTeacherCookie } from '../lib/sessionUtils';
import styles from '../styles/Dashboard.module.css';

const TESTING_PLATFORMS = ['Kahoot', 'Cambium Assessment', 'Pear Deck'];

export default function TeacherDashboard() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teacherEmail, setTeacherEmail] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionStudents, setSessionStudents] = useState([]);
  const [sessionPaused, setSessionPaused] = useState(false);

  useEffect(() => {
    if (!isTeacherLoggedIn()) {
      router.replace('/teacher-auth');
      return undefined;
    }

    const cookie = getTeacherCookie();
    setTeacherEmail(cookie.email || 'Teacher');
    const sessionsRef = ref(database, `teachers/${cookie.uid}/sessions`);
    return onValue(sessionsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setSessions(Object.entries(data).map(([id, session]) => ({ id, ...session }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    });
  }, [router]);

  useEffect(() => {
    if (!selectedSession) return undefined;
    const cookie = getTeacherCookie();
    const sessionRef = ref(database, `teachers/${cookie.uid}/sessions/${selectedSession.id}`);
    return onValue(sessionRef, (snapshot) => {
      const session = snapshot.val();
      if (!session) return;
      setSelectedSession((current) => ({ ...current, ...session }));
      setSessionPaused(Boolean(session.paused));
      setSessionStudents(Object.entries(session.students || {}).map(([id, student]) => ({ id, ...student })));
    });
  }, [selectedSession?.id]);

  const togglePlatform = (platform) => {
    setSelectedPlatforms((current) => current.includes(platform)
      ? current.filter((item) => item !== platform)
      : [...current, platform]);
  };

  const handleCreateSession = async (event) => {
    event.preventDefault();
    if (!sessionName.trim() || selectedPlatforms.length === 0) return;
    setLoading(true);
    try {
      const cookie = getTeacherCookie();
      await push(ref(database, `teachers/${cookie.uid}/sessions`), {
        name: sessionName.trim(),
        platforms: selectedPlatforms,
        platform: selectedPlatforms[0],
        code: generateSessionCode(),
        createdAt: new Date().toISOString(),
        status: 'active',
        sessionStarted: true,
        paused: false,
        students: {}
      });
      setSessionName('');
      setSelectedPlatforms([]);
      setShowCreateModal(false);
    } finally {
      setLoading(false);
    }
  };

  const updateSelectedSession = (changes) => {
    if (!selectedSession) return Promise.resolve();
    const cookie = getTeacherCookie();
    return update(ref(database, `teachers/${cookie.uid}/sessions/${selectedSession.id}`), changes);
  };

  const handleStopSession = async () => {
    await updateSelectedSession({ status: 'closed', sessionStarted: false, paused: false });
    setSelectedSession(null);
  };

  const handleLogout = async () => {
    await signOut(auth).catch(() => undefined);
    removeTeacherCookie();
    router.push('/');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Teacher Dashboard</h1>
        <div className={styles.headerRight}><span>{teacherEmail}</span><button onClick={handleLogout} className={styles.logoutBtn}>Log out</button></div>
      </header>
      <main className={styles.main}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div><h2>Current sessions</h2><p>Start a session and share its code with your students.</p></div>
            <button onClick={() => setShowCreateModal(true)} className={styles.primaryBtn}>Start new session</button>
          </div>
          {sessions.length === 0 ? <p className={styles.empty}>No sessions yet. Start one to get your class connected.</p> : <div className={styles.sessionGrid}>{sessions.map((session) => <button key={session.id} type="button" className={`${styles.sessionCard} ${session.status === 'closed' ? styles.closed : ''}`} onClick={() => setSelectedSession(session)}><h3>{session.name}</h3><p className={styles.platform}>{(session.platforms || [session.platform]).join(' · ')}</p><p className={styles.code}>Code: <strong>{session.code}</strong></p><p className={styles.status}>{session.status === 'closed' ? 'Closed' : session.paused ? 'Paused' : 'Live'}</p><p className={styles.studentCount}>{Object.keys(session.students || {}).length} students</p></button>)}</div>}
        </div>
      </main>

      {showCreateModal && <div className={styles.modal}><form className={styles.modalContent} onSubmit={handleCreateSession}><h2>Start a new session</h2><label>Session name<input autoFocus value={sessionName} onChange={(event) => setSessionName(event.target.value)} className={styles.input} placeholder="Period 2 math review" required /></label><fieldset><legend>Choose testing tools</legend>{TESTING_PLATFORMS.map((platform) => <label key={platform} className={styles.checkbox}><input type="checkbox" checked={selectedPlatforms.includes(platform)} onChange={() => togglePlatform(platform)} />{platform}</label>)}</fieldset><div className={styles.modalButtons}><button type="submit" disabled={loading || selectedPlatforms.length === 0} className={styles.primaryBtn}>{loading ? 'Starting...' : 'Start session'}</button><button type="button" onClick={() => setShowCreateModal(false)} className={styles.secondaryBtn}>Cancel</button></div></form></div>}

      {selectedSession && <div className={styles.modal}><section className={styles.sessionControlPanel}><button className={styles.closeBtn} onClick={() => setSelectedSession(null)} aria-label="Close session controls">×</button><h2>{selectedSession.name}</h2><p>Share this code with students</p><div className={styles.code}>{selectedSession.code}</div><div className={styles.controlButtons}>{sessionPaused ? <button onClick={() => updateSelectedSession({ paused: false })} className={styles.resumeBtn}>Resume all</button> : <button onClick={() => updateSelectedSession({ paused: true })} className={styles.pauseBtn}>Pause all</button>}<button onClick={handleStopSession} className={styles.stopBtn}>Stop session</button></div><div className={styles.studentList}><h3>Students in session ({sessionStudents.length})</h3>{sessionStudents.length === 0 ? <p className={styles.empty}>Students will appear here after they join.</p> : sessionStudents.map((student) => <div key={student.id} className={styles.studentItem}><span>{student.name}</span><button onClick={() => update(ref(database, `teachers/${getTeacherCookie().uid}/sessions/${selectedSession.id}/students/${student.id}`), { paused: !student.paused })} className={styles.pauseStudentBtn}>{student.paused ? 'Resume' : 'Pause'}</button></div>)}</div></section></div>}
    </div>
  );
}
