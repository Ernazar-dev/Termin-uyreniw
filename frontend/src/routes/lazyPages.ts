import { lazy } from 'react';

/** Every page is a separate chunk, loaded only when its route is opened. */

export const HomePage = lazy(() => import('../pages/public/Home/Home'));
export const NotFoundPage = lazy(() => import('../pages/public/NotFound/NotFound'));

export const LoginPage = lazy(() => import('../pages/auth/Login/Login'));
export const RegisterPage = lazy(() => import('../pages/auth/Register/Register'));

export const TeacherDashboard = lazy(() => import('../pages/teacher/Dashboard/Dashboard'));
export const TeacherClasses = lazy(() => import('../pages/teacher/Classes/Classes'));
export const TeacherChapters = lazy(() => import('../pages/teacher/Chapters/Chapters'));
export const TeacherTerms = lazy(() => import('../pages/teacher/Terms/Terms'));
export const TeacherGames = lazy(() => import('../pages/teacher/Games/Games'));
export const TeacherTests = lazy(() => import('../pages/teacher/Tests/Tests'));
export const TeacherStudents = lazy(() => import('../pages/teacher/Students/Students'));
export const TeacherResults = lazy(() => import('../pages/teacher/Results/Results'));

export const StudentDashboard = lazy(() => import('../pages/student/Dashboard/Dashboard'));
export const StudentClasses = lazy(() => import('../pages/student/Classes/Classes'));
export const StudentClassDetail = lazy(() => import('../pages/student/Classes/ClassDetail'));
export const StudentChapter = lazy(() => import('../pages/student/Chapters/ChapterDetail'));
export const StudentTerms = lazy(() => import('../pages/student/Terms/Terms'));
export const StudentTermDetail = lazy(() => import('../pages/student/Terms/TermDetail'));
export const StudentGames = lazy(() => import('../pages/student/Games/Games'));
export const StudentGamePlay = lazy(() => import('../pages/student/Games/GamePlay'));
export const StudentTests = lazy(() => import('../pages/student/Tests/Tests'));
export const StudentTestPlay = lazy(() => import('../pages/student/Tests/TestPlay'));
export const StudentResults = lazy(() => import('../pages/student/Results/Results'));
export const StudentResultDetail = lazy(() => import('../pages/student/Results/ResultDetail'));
export const StudentAIChat = lazy(() => import('../pages/student/AIChat/AIChat'));
