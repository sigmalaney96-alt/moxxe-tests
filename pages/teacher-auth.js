import { useState } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { setTeacherCookie } from '../lib/sessionUtils';
import styles from '../styles/Auth.module.css';

export default function TeacherAuth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        setTeacherCookie(user.uid, user.email);
        router.push('/teacher-dashboard');
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        setTeacherCookie(user.uid, user.email);
        router.push('/teacher-dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>{isSignUp ? 'Teacher Sign Up' : 'Teacher Login'}</h1>

        <form onSubmit={handleAuth} className={styles.form}>
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.input}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={styles.input}
          />

          {isSignUp && (
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={styles.input}
            />
          )}

          {error && <div className={styles.error}>{error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            className={styles.button}
          >
            {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Login')}
          </button>
        </form>

        <p className={styles.toggle}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button 
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            className={styles.toggleBtn}
          >
            {isSignUp ? 'Login' : 'Sign Up'}
          </button>
        </p>

        <button 
          onClick={() => router.push('/')}
          className={styles.backBtn}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
