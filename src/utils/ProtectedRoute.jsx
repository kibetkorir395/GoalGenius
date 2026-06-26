import { Navigate, useLocation } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { userState } from '../recoil/atoms';

const ProtectedRoute = ({ children }) => {
  const user = useRecoilValue(userState);
  const location = useLocation();
  return user ? children : <Navigate to="/login" state={{ from: location }} replace />;
};

export default ProtectedRoute;
