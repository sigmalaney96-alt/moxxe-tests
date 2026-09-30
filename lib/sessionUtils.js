import Cookies from 'js-cookie';

// Session code generator (6 digits with letters and numbers)
export const generateSessionCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Cookie management
export const setTeacherCookie = (uid, email) => {
  Cookies.set('teacher_uid', uid, { expires: 7 });
  Cookies.set('teacher_email', email, { expires: 7 });
};

export const getTeacherCookie = () => {
  return {
    uid: Cookies.get('teacher_uid'),
    email: Cookies.get('teacher_email')
  };
};

export const removeTeacherCookie = () => {
  Cookies.remove('teacher_uid');
  Cookies.remove('teacher_email');
};

export const isTeacherLoggedIn = () => {
  return !!Cookies.get('teacher_uid');
};

// Student session management
export const setStudentSession = (sessionCode, studentName) => {
  sessionStorage.setItem('student_session_code', sessionCode);
  sessionStorage.setItem('student_name', studentName);
};

export const getStudentSession = () => {
  return {
    sessionCode: sessionStorage.getItem('student_session_code'),
    studentName: sessionStorage.getItem('student_name')
  };
};
