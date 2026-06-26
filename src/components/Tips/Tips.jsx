import { MdArrowBackIos, MdArrowForwardIos } from 'react-icons/md';
import TipCard from '../TipCard/TipCard';
import './Tips.scss';
import { useEffect, useRef, useState, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import AppHelmet from '../../pages/AppHelmet';
import ScrollToTop from '../../pages/ScrollToTop';
import { useRecoilState } from 'recoil';
import { userState } from '../../recoil/atoms';
import Loader from '../Loader/Loader';
import { getTips } from '../../firebase';

const TIME_SLOTS = {
  'Morning': { label: 'Morning', sub: '12AM - 6AM', icon: '🌙' },
  'Afternoon': { label: 'Afternoon', sub: '6AM - 12PM', icon: '☀️' },
  'Evening': { label: 'Evening', sub: '12PM - 6PM', icon: '🌤️' },
  'Night': { label: 'Night', sub: '6PM - 12AM', icon: '🌙' },
};

const GAME_TYPES = [
  { value: 'ALL', label: 'All', icon: '⚽' },
  { value: '1X2', label: 'WDW', icon: '1️⃣' },
  { value: 'CS', label: 'CS', icon: '🎯' },
  { value: 'GG', label: 'BTTS', icon: '⚡' },
  { value: 'OV_UN', label: 'Total', icon: '📊' },
];

export default function Tips() {
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(null);
  const [currentDate, setCurrentDate] = useState(null);
  const [user, setUser] = useRecoilState(userState);
  const [isAdmin, setAdmin] = useState(false);
  const [filteredTips, setFilteredTips] = useState(null);
  const [gamesType, setGamesType] = useState('ALL');
  const [tips, setTips] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  const tabBoxRef = useRef(null);
  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const startX = useRef(0);
  const startScroll = useRef(0);

  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US');
  }, []);

  const returnDate = useCallback((dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return { weekday: 'Invalid', day: 'Date', isToday: false };
    const today = new Date();
    const isToday = date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
    const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return isToday ? { weekday: 'Today', day: monthDay, isToday: true } : { weekday, day: monthDay, isToday: false };
  }, []);

  const handleIcons = useCallback(() => {
    if (!tabBoxRef.current) return;
    const scrollVal = Math.round(tabBoxRef.current.scrollLeft);
    const maxScroll = tabBoxRef.current.scrollWidth - tabBoxRef.current.clientWidth;
    setShowLeft(scrollVal > 2);
    setShowRight(maxScroll > scrollVal + 2);
  }, []);

  const handleScrollClick = useCallback((direction) => {
    if (!tabBoxRef.current) return;
    const scrollAmount = direction === 'left' ? -280 : 280;
    tabBoxRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${dd}`);
    }
    setDays(dates.reverse());
  }, []);

  useEffect(() => {
    if (days) setCurrentDate(days[days.length - 1]);
  }, [days]);

  useEffect(() => {
    if (!tabBoxRef.current || !days) return;
    const tabBox = tabBoxRef.current;
    tabBox.scrollLeft = tabBox.scrollWidth - tabBox.clientWidth;
    handleIcons();
  }, [days, handleIcons]);

  useEffect(() => {
    if (currentDate) getTips(setTips, setLoading, formatDate(currentDate));
  }, [currentDate, formatDate]);

  useEffect(() => {
    if (tips === null) return;
    const grouped = {};
    tips.forEach(item => {
      const [hours] = item.time.split(':').map(Number);
      let slot = 'Morning';
      if (hours >= 6 && hours < 12) slot = 'Afternoon';
      else if (hours >= 12 && hours < 18) slot = 'Evening';
      else if (hours >= 18) slot = 'Night';
      if (!grouped[slot]) grouped[slot] = [];
      grouped[slot].push(item);
    });
    const result = Object.keys(grouped).map(timeSlot => ({
      timeSlot,
      items: grouped[timeSlot].sort((a, b) => a.time.localeCompare(b.time))
    })).sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
    setFilteredTips(result);
    setTotalCount(tips.length);
  }, [tips]);

  useEffect(() => {
    const tabBox = tabBoxRef.current;
    if (!tabBox) return;

    const onDown = (e) => {
      isDragging.current = true;
      hasDragged.current = false;
      startX.current = e.pageX;
      startScroll.current = tabBox.scrollLeft;
      tabBox.style.cursor = 'grabbing';
    };
    const onMove = (e) => {
      if (!isDragging.current) return;
      const dx = e.pageX - startX.current;
      if (Math.abs(dx) > 5) hasDragged.current = true;
      tabBox.scrollLeft = startScroll.current - dx;
    };
    const onUp = () => {
      isDragging.current = false;
      tabBox.style.cursor = 'grab';
    };
    const onScroll = () => handleIcons();

    tabBox.addEventListener('mousedown', onDown);
    tabBox.addEventListener('mousemove', onMove);
    tabBox.addEventListener('mouseup', onUp);
    tabBox.addEventListener('mouseleave', onUp);
    tabBox.addEventListener('scroll', onScroll);

    return () => {
      tabBox.removeEventListener('mousedown', onDown);
      tabBox.removeEventListener('mousemove', onMove);
      tabBox.removeEventListener('mouseup', onUp);
      tabBox.removeEventListener('mouseleave', onUp);
      tabBox.removeEventListener('scroll', onScroll);
    };
  }, [handleIcons]);

  useEffect(() => {
    const admins = ['kkibetkkoir@gmail.com', 'charleykibet254@gmail.com', 'coongames8@gmail.com'];
    setAdmin(user && admins.includes(user.email));
  }, [user]);

  const todayStr = days ? formatDate(days[days.length - 1]) : '';

  return (
    <div className='tips-section'>
      <AppHelmet title={'Tips'} />
      <ScrollToTop />

      <div className='tips-header'>
        <h2 className='section-title'>Match Predictions</h2>
        <p className='section-subtitle'>
          {totalCount > 0 ? `${totalCount} tips available for today` : 'Daily tips updated regularly'}
        </p>
      </div>

      <div className='date-picker'>
        <button className={`date-arrow ${showLeft ? 'visible' : ''}`} onClick={() => handleScrollClick('left')}>
          <MdArrowBackIos />
        </button>
        <ul className='date-tabs' ref={tabBoxRef} style={{ cursor: 'grab' }}>
          {days && days.map((day) => {
            const info = returnDate(day);
            return (
              <li
                key={day}
                className={`date-tab ${currentDate === day ? 'active' : ''} ${info.isToday ? 'today' : ''}`}
                onClick={() => {
                  if (!hasDragged.current) setCurrentDate(day);
                }}
                aria-label={day}
              >
                <span className='day-name'>{info.weekday}</span>
                <span className='day-date'>{info.day}</span>
                {info.isToday && <span className='today-badge' />}
              </li>
            );
          })}
        </ul>
        <button className={`date-arrow ${showRight ? 'visible' : ''}`} onClick={() => handleScrollClick('right')}>
          <MdArrowForwardIos />
        </button>
      </div>

      <div className='game-filter'>
        {GAME_TYPES.map((type) => (
          <button
            key={type.value}
            className={`filter-chip ${gamesType === type.value ? 'active' : ''}`}
            onClick={() => setGamesType(type.value)}
          >
            <span className='chip-icon'>{type.icon}</span>
            <span className='chip-label'>{type.label}</span>
          </button>
        ))}
      </div>

      <div className='tips-cta'>
        <NavLink to='/subscribe' className='btn'>
          <span className='diamond'>💎</span>
          Unlock VIP Tips
        </NavLink>
      </div>

      {loading && <Loader />}

      {!loading && (
        <div className='tips-content'>
          {filteredTips && filteredTips.map((group) => {
            const slot = TIME_SLOTS[group.timeSlot];
            const items = group.items.filter(doc => gamesType === 'ALL' || doc.type === gamesType);
            if (items.length === 0) return null;
            return (
              <div className='time-group' key={group.timeSlot}>
                <div className='time-group-header'>
                  <span className='time-icon'>{slot.icon}</span>
                  <div className='time-info'>
                    <span className='time-label'>{slot.label}</span>
                    <span className='time-sub'>{slot.sub}</span>
                  </div>
                  <span className='time-count'>{items.length} {items.length === 1 ? 'match' : 'matches'}</span>
                </div>
                <div className='tip-cards'>
                  {items.map((tip, index) => (
                    <TipCard key={tip.id || index} tip={tip} isAdmin={isAdmin} today={todayStr} />
                  ))}
                </div>
              </div>
            );
          })}
          {filteredTips && !filteredTips.some(g => g.items.some(doc => gamesType === 'ALL' || doc.type === gamesType)) && (
            <div className='no-tips'>
              <div className='no-tips-icon'>🎯</div>
              <h3>No tips available</h3>
              <p>No matches found for the selected date and filter.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
