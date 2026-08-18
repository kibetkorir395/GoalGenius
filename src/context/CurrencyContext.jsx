import { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Only Kenya and Nigeria are supported. Default fallback is Kenya (KES).
const COUNTRIES = {
    KE: { code: 'KE', name: 'Kenya', currency: 'KES', symbol: 'KSH', rate: 1 },
    NG: { code: 'NG', name: 'Nigeria', currency: 'NGN', symbol: '₦', rate: 11.63 },
    GH: { code: 'GH', name: 'Ghana', currency: 'GHS', symbol: 'GH₵', rate: 0.11 },
    ZA: { code: 'ZA', name: 'South Africa', currency: 'ZAR', symbol: 'R', rate: 0.14 },
    UG: { code: 'UG', name: 'Uganda', currency: 'UGX', symbol: 'USh', rate: 28.5 },
    TZ: { code: 'TZ', name: 'Tanzania', currency: 'TZS', symbol: 'TSh', rate: 20.2 },
    RW: { code: 'RW', name: 'Rwanda', currency: 'RWF', symbol: 'FRw', rate: 10.1 },
    ZM: { code: 'ZM', name: 'Zambia', currency: 'ZMW', symbol: 'ZK', rate: 0.21 },
    MW: { code: 'MW', name: 'Malawi', currency: 'MWK', symbol: 'MK', rate: 13.2 },
    BF: { code: 'BF', name: 'Burkina Faso', currency: 'XOF', symbol: 'CFA', rate: 4.6 },
    CI: { code: 'CI', name: "Côte d'Ivoire", currency: 'XOF', symbol: 'CFA', rate: 4.6 },
    SN: { code: 'SN', name: 'Senegal', currency: 'XOF', symbol: 'CFA', rate: 4.6 },
    CM: { code: 'CM', name: 'Cameroon', currency: 'XAF', symbol: 'FCFA', rate: 4.6 },
    US: { code: 'US', name: 'United States', currency: 'USD', symbol: '$', rate: 0.0076 },
    GB: { code: 'GB', name: 'United Kingdom', currency: 'GBP', symbol: '£', rate: 0.006 },
    EU: { code: 'EU', name: 'Eurozone', currency: 'EUR', symbol: '€', rate: 0.007 }
};

const DEFAULT_COUNTRY = COUNTRIES.KE;

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
    const [country, setCountry] = useState(DEFAULT_COUNTRY);
    const [detected, setDetected] = useState(null);
    const [locality, setLocality] = useState(null);
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
        locality
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
            locality: null,
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
