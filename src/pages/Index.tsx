import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePOS } from '@/contexts/POSContext';

const Index = () => {
  const { currentUser } = usePOS();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'chef') {
        navigate('/kitchen');
      } else {
        navigate('/dashboard');
      }
    } else {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  return null;
};

export default Index;
