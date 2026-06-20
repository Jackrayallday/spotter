import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function Profile() {
    const { user, isLoading, isPlanLoading, plan } = useAuth();

    if (isLoading || isPlanLoading) {
        return <div className="min-h-screen pt-24 px-6">Loading your plan...</div>;
    }

    if(!user){
        return <Navigate to="/auth/sign-in" replace/>;
    }

    if(!plan) {
        return <Navigate to="/onboarding" replace/>;
    }
    return(
    <div className="min-h-screen pt-24  pb-12 px-6">
        <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-1">Your Training Plan</h1>
                    <p className="text-[var(--color-muted)]">Version {plan.version} * Created</p>
                </div>
            </div>
        </div>
    </div>
    );
}
