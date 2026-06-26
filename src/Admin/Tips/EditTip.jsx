import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom';
import Loader from '../../components/Loader/Loader';
import AppHelmet from '../../pages/AppHelmet';
import '../AdminAdd.scss';
import { updateTip } from '../../firebase';
import ScrollToTop from '../../pages/ScrollToTop';
import { useSetRecoilState } from 'recoil';
import { notificationState } from '../../recoil/atoms';
import { FiSave, FiArrowLeft } from 'react-icons/fi';

export default function EditTip() {
    const [home, setHome] = useState('');
    const [away, setAway] = useState('');
    const [odd, setOdd] = useState('');
    const [pick, setPick] = useState('');
    const [status, setStatus] = useState('');
    const [time, setTime] = useState('');
    const [won, setWon] = useState('');
    const [premium, setPremium] = useState(false);
    const [gamesType, setGamesType] = useState("1X2");
    const [results, setResults] = useState('');
    const [loading, setLoading] = useState(false);
    const setNotification = useSetRecoilState(notificationState);
    const [data, setData] = useState(null);
    const navigate = useNavigate();

    const handleChange = (event) => {
        setGamesType(event.target.value);
    };

    const location = useLocation();

    useEffect(() => {
        setData(location.state);
    }, [location]);

    const handleSubmit = (e) => {
        e.preventDefault()
        const d = new Date(time);
        const date = new Intl.DateTimeFormat('en-US').format(d);
        const timeOnly = d.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });

        updateTip(data.id, { home, away, odd, pick, status, won, premium, type: gamesType, results, date, time: timeOnly }, setNotification, setLoading, setData);
    }

    const formatDateTimeForInput = (date, time) => {
        const [month, day, year] = date.split('/').map((part) => parseInt(part, 10));
        const formattedDate = new Date(year, month - 1, day);
        const yearStr = formattedDate.getFullYear();
        const monthStr = String(formattedDate.getMonth() + 1).padStart(2, '0');
        const dayStr = String(formattedDate.getDate()).padStart(2, '0');
        return `${yearStr}-${monthStr}-${dayStr}T${time}`;
    };

    useEffect(() => {
        if (data) {
            setHome(data.home);
            setAway(data.away);
            setOdd(data.odd);
            setPick(data.pick);
            setStatus(data.status);
            setResults(data.results)
            setWon(data.won);
            setPremium(data.premium);
            setGamesType(data.type);

            const datetimeLocal = formatDateTimeForInput(data.date, data.time);
            setTime(datetimeLocal);
        }
    }, [data]);

    return (
        <div className='admin-tips'>
            <AppHelmet title={"Edit Tip"} />
            <ScrollToTop />
            <h1>Update Tip</h1>
            {!loading && (
                <form onSubmit={handleSubmit}>
                    <div className="input-container vertical">
                        <label htmlFor="home">Home Team</label>
                        <input type="text" placeholder='home' id='home' value={home} onChange={(e) => setHome(e.target.value)} required />
                    </div>
                    <div className="input-container vertical">
                        <label htmlFor="away">Away Team</label>
                        <input type="text" placeholder='away' id='away' value={away} onChange={(e) => setAway(e.target.value)} required />
                    </div>
                    <div className="input-container">
                        <label htmlFor="odds">Odds</label>
                        <input type="text" placeholder='odds' id='odds' value={odd} onChange={(e) => setOdd(e.target.value)} required />
                    </div>
                    <div className="input-container">
                        <label htmlFor="pick">Pick</label>
                        <input type="text" placeholder='pick' id='pick' value={pick} onChange={(e) => setPick(e.target.value)} required />
                    </div>
                    <div className="input-container">
                        <label htmlFor="status">Status</label>
                        <input type="text" placeholder='Finish / Pending / Live' id='status' value={status} onChange={(e) => setStatus(e.target.value)} required />
                    </div>
                    <div className="input-container">
                        <label htmlFor="time">Date & Time</label>
                        <input type="datetime-local" id='time' value={time} onChange={(e) => setTime(e.target.value)} required />
                    </div>
                    <div className="input-container">
                        <label htmlFor="results">Results</label>
                        <input type="text" placeholder='results' id='results' value={results} onChange={(e) => setResults(e.target.value)} />
                    </div>
                    <div className="input-container">
                        <label htmlFor="won">Is Won</label>
                        <input type="text" placeholder='won / pending / lost' id='won' value={won} onChange={(e) => setWon(e.target.value)} required />
                    </div>
                    <div className="input-container">
                        <label className="checkbox-label">
                            <input type="checkbox" id='premium' onChange={(e) => setPremium(e.target.checked)} checked={premium} />
                            Premium Tip
                        </label>
                    </div>
                    <div className="input-container">
                        <label>Select Type</label>
                        <div className="radio-group">
                            <label className="radio-label">
                                <input type="radio" name="games-type" value="1X2" checked={gamesType === "1X2"} onChange={handleChange} />
                                WDW (1X2)
                            </label>
                            <label className="radio-label">
                                <input type="radio" name="games-type" value="CS" checked={gamesType === "CS"} onChange={handleChange} />
                                Goals (CS)
                            </label>
                            <label className="radio-label">
                                <input type="radio" name="games-type" value="GG" checked={gamesType === "GG"} onChange={handleChange} />
                                BTTS (GG/NG)
                            </label>
                            <label className="radio-label">
                                <input type="radio" name="games-type" value="OV_UN" checked={gamesType === "OV_UN"} onChange={handleChange} />
                                Total (OV/UN)
                            </label>
                            <label className="radio-label">
                                <input type="radio" name="games-type" value="DC" checked={gamesType === "DC"} onChange={handleChange} />
                                DC 1X2
                            </label>
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="submit" className='btn' title='Submit' aria-label="add">
                            <FiSave /> Update
                        </button>
                        <button type="button" className='btn secondary' onClick={() => navigate('/')}>
                            <FiArrowLeft /> Done
                        </button>
                    </div>
                </form>
            )}
            {loading && <Loader />}
        </div>
    )
}
