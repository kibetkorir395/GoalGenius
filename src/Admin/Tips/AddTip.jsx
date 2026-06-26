import {useState } from 'react'
import AppHelmet from '../../pages/AppHelmet';
import Loader from '../../components/Loader/Loader';
import '../AdminAdd.scss';
import { addTip } from '../../firebase';
import ScrollToTop from '../../pages/ScrollToTop';
import { notificationState } from '../../recoil/atoms';
import { useSetRecoilState } from 'recoil';
import { FiPlus, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export default function AddTip() {
    const [home, setHome] = useState('');
    const [away, setAway] = useState('');
    const [odd, setOdd] = useState('');
    const [pick, setPick] = useState('');
    const [status, setStatus] = useState('');
    const [time, setTime] = useState('');
    const [won, setWon] = useState('');
    const [premium, setPremium] = useState(false);
    const [results, setResults] = useState('');
    const [loading, setLoading] = useState(false);
    const setNotification = useSetRecoilState(notificationState);
    const navigate = useNavigate();

    const [gamesType, setGamesType] = useState("1X2");

    const handleChange = (event) => {
        setGamesType(event.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const d = new Date(time);
        const date = new Intl.DateTimeFormat('en-US').format(d);
        const timeOnly = d.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });

        addTip({
            home,
            away,
            date,
            odd,
            pick,
            status,
            time: timeOnly,
            won,
            premium,
            results,
            type: gamesType
        }, setNotification, setLoading);
    };

    return (
        <div className='admin-tips'>
            <AppHelmet title={"Add Tip"}/>
            <ScrollToTop />
            <h1>Add Tip</h1>
            {!loading && (
                <form onSubmit={handleSubmit}>
                    <div className="input-container vertical">
                        <label htmlFor="home">Home Team</label>
                        <input type="text" placeholder='e.g. Manchester United' id='home' value={home} onChange={(e) => setHome(e.target.value)} required/>
                    </div>
                    <div className="input-container vertical">
                        <label htmlFor="away">Away Team</label>
                        <input type="text" placeholder='e.g. Liverpool' id='away' value={away} onChange={(e) => setAway(e.target.value)} required/>
                    </div>
                    <div className="input-container">
                        <label htmlFor="odds">Odds</label>
                        <input type="text" placeholder='1.85' id='odds' value={odd} onChange={(e) => setOdd(e.target.value)} required/>
                    </div>
                    <div className="input-container">
                        <label htmlFor="pick">Pick</label>
                        <input type="text" placeholder='1 / X / 2 / Over 2.5' id='pick' value={pick} onChange={(e) => setPick(e.target.value)} required/>
                    </div>
                    <div className="input-container">
                        <label htmlFor="status">Status</label>
                        <input type="text" placeholder='Finish / Pending / Live' id='status' value={status} onChange={(e) => setStatus(e.target.value)} required/>
                    </div>
                    <div className="input-container">
                        <label htmlFor="time">Date & Time</label>
                        <input type="datetime-local" id='time' value={time} onChange={(e) => setTime(e.target.value)} required/>
                    </div>
                    <div className="input-container">
                        <label htmlFor="results">Results</label>
                        <input type="text" placeholder='2-1' id='results' value={results} onChange={(e) => setResults(e.target.value)}/>
                    </div>
                    <div className="input-container">
                        <label htmlFor="won">Is Won</label>
                        <input type="text" placeholder='won / pending / lost' id='won' value={won} onChange={(e) => setWon(e.target.value)} required/>
                    </div>
                    <div className="input-container">
                        <label className="checkbox-label">
                            <input type="checkbox" id='premium' onChange={(e) => setPremium(e.target.checked)} checked={premium}/>
                            Premium Tip
                        </label>
                    </div>
                    <div className="input-container">
                        <label>Select Type</label>
                        <div className="radio-group">
                            <label className="radio-label">
                                <input type="radio" name="games-type" value="1X2" checked={gamesType === "1X2"} onChange={handleChange}/>
                                WDW (1X2)
                            </label>
                            <label className="radio-label">
                                <input type="radio" name="games-type" value="CS" checked={gamesType === "CS"} onChange={handleChange}/>
                                Goals (CS)
                            </label>
                            <label className="radio-label">
                                <input type="radio" name="games-type" value="GG" checked={gamesType === "GG"} onChange={handleChange}/>
                                BTTS (GG/NG)
                            </label>
                            <label className="radio-label">
                                <input type="radio" name="games-type" value="OV_UN" checked={gamesType === "OV_UN"} onChange={handleChange}/>
                                Total (OV/UN)
                            </label>
                            <label className="radio-label">
                                <input type="radio" name="games-type" value="DC" checked={gamesType === "DC"} onChange={handleChange}/>
                                DC 1X2
                            </label>
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="submit" className='btn' title='Add Tip' aria-label="add">
                            <FiPlus /> Add Tip
                        </button>
                        <button type="button" className='btn secondary' onClick={() => navigate('/')}>
                            <FiArrowLeft /> Back
                        </button>
                    </div>
                </form>
            )}
            {loading && <Loader />}
        </div>
    )
}
