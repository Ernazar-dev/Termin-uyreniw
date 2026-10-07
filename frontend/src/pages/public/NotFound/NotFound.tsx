import { Button, Result } from 'antd';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../utils/constants';

const NotFound = () => (
  <Result
    status="404"
    title="404"
    subTitle="Bunday bet tabılmadı."
    extra={
      <Link to={ROUTES.home}>
        <Button type="primary">Bas betke qaytıw</Button>
      </Link>
    }
  />
);

export default NotFound;
