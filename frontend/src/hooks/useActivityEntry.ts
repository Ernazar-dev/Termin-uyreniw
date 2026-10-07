import { App } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { ROUTES } from '../utils/constants';

const DEFAULT_CONTENT =
  'Testti baslaw hám nátiyjeńizdi saqlaw ushın akkauntıńızǵa kiriń. Kirgennen keyin tańlaǵan testińiz ashıladı.';

/** Browsing stays public; signing in is an explicit choice when starting an activity. */
export const useActivityEntry = () => {
  const { user } = useAuth();
  const { modal } = App.useApp();
  const navigate = useNavigate();
  return (path: string, content: string = DEFAULT_CONTENT) => {
    if (user) { navigate(path); return; }
    modal.confirm({
      title: 'Akkauntqa kiriń',
      content,
      okText: 'Kiriw',
      cancelText: 'Házir emes',
      centered: true,
      onOk: () => { navigate(ROUTES.login, { state: { from: path } }); },
    });
  };
};
