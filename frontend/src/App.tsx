import { App as AntApp, ConfigProvider } from 'antd';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './hooks/AuthProvider';
import { AppRouter } from './routes/AppRouter';
import { theme } from './styles/theme';
import { kaaLocale } from './locales/kaa';

const App = () => (
  <ConfigProvider theme={theme} locale={kaaLocale}>
    <AntApp>
      <AuthProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </AuthProvider>
    </AntApp>
  </ConfigProvider>
);

export default App;
