import { createContext, useState, type ReactNode, useEffect, useContext, useCallback, useMemo, useRef } from 'react'
import type {TrainingPlan, User, UserProfile} from '../types'
import { authClient } from '../lib/auth';
import { api } from '../lib/api';

interface AuthContextType {
    user:  User | null;
    plan: TrainingPlan | null;
    isLoading: boolean;
    isPlanLoading: boolean;
    saveProfile: (profile: Omit<UserProfile, 'userId' | 'updatedAt'>,
    ) => Promise<void>;
    generatePlan: () => Promise<void>;
    refreshData: () => Promise<void>;
}

const AuthContext = createContext <AuthContextType | null>(null)

export default function AuthProvider({ children } : { children: ReactNode})
{
    const { data: session, isPending: isLoading } = authClient.useSession();
    const neonUser = useMemo<User | null>(() => {
        if (!session?.user) return null;

        return {
            id: session.user.id,
            email: session.user.email,
            createdAt: session.user.createdAt.toISOString(),
        };
    }, [session?.user]);
    const [plan, setPlan] = useState<TrainingPlan | null>(null);
    const [isPlanLoading, setIsPlanLoading] = useState(true);
    const isRefreshingRef = useRef(false)

    const refreshData = useCallback(async() => {
        if(!neonUser || isRefreshingRef.current) return;
        isRefreshingRef.current = true;
        setIsPlanLoading(true);

        try {
            const planData = await api.getCurrentPlan(neonUser.id);
            setPlan(planData ? {
                id: planData.id,
                userId: planData.userId,
                overview: planData.planJson.overview,
                weeklySchedule: planData.planJson.weeklySchedule,
                progression: planData.planJson.progression,
                version: planData.version,
                createdAt: planData.createdAt,
            } : null);
        } catch (error) {
            console.error("Error refreshing data:", error);
            setPlan(null);
        } finally {
            isRefreshingRef.current = false;
            setIsPlanLoading(false);
        }
    }, [neonUser]);

useEffect(() => {
    if(!isLoading){
        if(neonUser?.id){
            refreshData();
        } else{
            setPlan(null);
            setIsPlanLoading(false);
        }
    }
}, [neonUser?.id, isLoading, refreshData]);


    async function saveProfile(profileData: Omit<UserProfile, 'userId' | 'updatedAt'>) {
        if (!neonUser) {
            throw new Error("User must be authenticated to save profile");
        }
        await api.saveProfile(neonUser.id, profileData);
        await refreshData();
    }

    async function generatePlan() {
        if (!neonUser) {
            throw new Error("User must be authenticated to generate plan");
        }
        await api.generatePlan(neonUser.id);
        await refreshData();
    }


    return <AuthContext.Provider value={{user: neonUser, plan, isLoading, isPlanLoading, saveProfile, generatePlan, refreshData}}>{ children }</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
