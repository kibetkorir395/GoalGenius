import { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Only Kenya and Nigeria are supported. Default fallback is Kenya (KES).
const COUNTRIES = {
    KE: { code: 'KE', name: 'Kenya', currency: 'KES', symbol: 'KSH', rate: 1 },
    NG: { code: 'NG', name: 'Nigeria', currency: 'NGN', symbol: '₦', rate: 11.63 },
};

const DEFAULT_COUNTRY = COUNTRIES.KE;

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
    const [country, setCountry] = useState(DEFAULT_COUNTRY);
    const [detected, setDetected] = useState(null);
    const [loading, setLoading] = useState(true);

    const detectCountry = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('https://ipapi.co/json/');
            if (res.ok) {
                const data = await res.json();
                const matched = COUNTRIES[data.country_code];
                if (matched) {
                    setCountry(matched);
                    setDetected(matched);
                    return;
                }
            }
            setCountry(DEFAULT_COUNTRY);
            setDetected(DEFAULT_COUNTRY);
        } catch (err) {
            setCountry(DEFAULT_COUNTRY);
            setDetected(DEFAULT_COUNTRY);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        detectCountry();
    }, [detectCountry]);

    const convertPrice = useCallback(
        (priceInKes) => Math.round((priceInKes || 0) * country.rate),
        [country]
    );

    const value = {
        country,
        detected,
        loading,
        currency: country.currency,
        symbol: country.symbol,
        rate: country.rate,
        convertPrice,
        setCountry,
    };

    return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
    const ctx = useContext(CurrencyContext);
    if (!ctx) {
        // Fallback so components render even if provider is missing
        return {
            country: DEFAULT_COUNTRY,
            detected: null,
            loading: false,
            currency: DEFAULT_COUNTRY.currency,
            symbol: DEFAULT_COUNTRY.symbol,
            rate: DEFAULT_COUNTRY.rate,
            convertPrice: (p) => Math.round((p || 0) * DEFAULT_COUNTRY.rate),
            setCountry: () => {},
        };
    }
    return ctx;
}
