'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';

const AppContext = createContext();

const fetcher = (...args) => fetch(...args).then(res => res.json());

export function AppProvider({ children }) {
    // Demo mode: hardcoded user ID 1 (Sidharth)
    const [currentUser, setCurrentUser] = useState(null);

    // Fetch current user
    const { data: userData, error: userError } = useSWR('/api/users', fetcher);

    useEffect(() => {
        if (userData?.user) {
            setCurrentUser(userData.user);
        }
    }, [userData]);

    // Real-time refresh helper
    const refreshData = () => {
        mutate('/api/debts?userId=1');
        mutate('/api/groups?userId=1');
        mutate('/api/activity?userId=1');
        mutate((key) => typeof key === 'string' && key.startsWith('/api/expenses'), undefined, { revalidate: true });
    };

    return (
        <AppContext.Provider value={{
            currentUser,
            refreshData,
            isLoading: !currentUser && !userError
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    return useContext(AppContext);
}
