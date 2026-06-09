import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function Profile() {
    const { user, isLoading } = useAuth();
    const plan = false;

    if(!user && !isLoading){
        return <Navigate to="/auth/sign-in" replace/>
    }

    if(!plan){
        return <Navigate to="/onboarding" replace/>
    }

    return <div>Profile Page</div>;
}
