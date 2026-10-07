import { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { PageLoader } from '../components';
import { StudentLayout } from '../layouts/StudentLayout';
import { ROLE_HOME, ROLES, ROUTES, TEXT } from '../utils/constants';
import { useAuth } from '../hooks/useAuth';
import * as Pages from './lazyPages';
import { ActivityRoute } from './ActivityRoute';
import { GuestRoute, ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';

const EntryPage = () => {
  const { user, initializing } = useAuth();
  if (initializing) return <PageLoader fullScreen />;
  return user ? <Navigate to={ROLE_HOME[user.role]} replace /> : <Pages.HomePage />;
};

export const AppRouter = () => (
  <Suspense fallback={<PageLoader fullScreen />}>
    <Routes>
      <Route element={<StudentLayout />}>
        <Route path={ROUTES.home} element={<EntryPage />} />
      </Route>

      <Route element={<GuestRoute />}>
        <Route path={ROUTES.login} element={<Pages.LoginPage />} />
        <Route path={ROUTES.register} element={<Pages.RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute role={ROLES.TEACHER} />}>
          <Route path={ROUTES.teacher.root} element={<Pages.TeacherLayout />}>
            <Route index element={<Navigate to={ROUTES.teacher.dashboard} replace />} />
            <Route path="dashboard" element={<Pages.TeacherDashboard />} />
            <Route path="classes" element={<Pages.TeacherClasses />} />
            <Route path="chapters" element={<Pages.TeacherChapters />} />
            <Route path="terms" element={<Pages.TeacherTerms />} />
            <Route path="games" element={<Pages.TeacherGames />} />
            <Route path="tests" element={<Pages.TeacherTests />} />
            <Route path="students" element={<Pages.TeacherStudents />} />
            <Route path="results" element={<Pages.TeacherResults />} />
          </Route>
        </Route>

      </Route>

      <Route path={ROUTES.student.root} element={<StudentLayout />}>
        <Route index element={<EntryPage />} />
        <Route path="classes" element={<Pages.StudentClasses />} />
        <Route path="classes/:classId" element={<Pages.StudentClassDetail />} />
        <Route path="chapters/:chapterId" element={<Pages.StudentChapter />} />
        <Route path="terms" element={<Pages.StudentTerms />} />
        <Route path="terms/:termId" element={<Pages.StudentTermDetail />} />
        <Route path="games" element={<Pages.StudentGames />} />
        <Route path="games/:chapterId" element={<Pages.StudentGamePlay />} />
        <Route path="tests" element={<Pages.StudentTests />} />
        <Route
          element={
            <ActivityRoute
              description="Testti baslaw hám nátiyjeńizdi saqlaw ushın akkauntıńızǵa kiriń."
              backTo={ROUTES.student.tests}
              backLabel="Testler dizimine qaytıw"
            />
          }
        >
          <Route path="tests/:testId" element={<Pages.StudentTestPlay />} />
        </Route>
        <Route
          element={
            <ActivityRoute
              description={TEXT.aiLoginHint}
              backTo={ROUTES.home}
              backLabel="Bas betke qaytıw"
            />
          }
        >
          <Route path="ai" element={<Pages.StudentAIChat />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute role={ROLES.STUDENT} />}>
            <Route path="dashboard" element={<Pages.StudentDashboard />} />
            <Route path="results" element={<Pages.StudentResults />} />
            <Route path="results/:resultId" element={<Pages.StudentResultDetail />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Pages.NotFoundPage />} />
    </Routes>
  </Suspense>
);
