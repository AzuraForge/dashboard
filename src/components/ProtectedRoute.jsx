// dashboard/src/components/ProtectedRoute.jsx
import { useLocation, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute() {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        // Oturum durumu kontrol edilirken bir yükleme ekranı gösterilebilir
        return <div style={{width:'100vw', height:'100vh', display:'grid', placeContent:'center'}}>Oturum kontrol ediliyor...</div>;
    }

    return (
        isAuthenticated
            ? <Outlet /> // Kullanıcı giriş yapmışsa, alt route'ları render et
            : <Navigate to="/login" state={{ from: location }} replace /> // Giriş yapmamışsa, login sayfasına yönlendir
    );
}

export default ProtectedRoute;