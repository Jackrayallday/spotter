import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function Profile() {
    const { user, isLoading } = useAuth();

    if(!user && !isLoading){
        return <Navigate to="/auth/sign-in" replace/>
    }

    return <div>Profile Page</div>;
}
