import './TipCard.scss';
import { truncateTitle } from "../../utils/textUtils";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { BiEdit } from "react-icons/bi";
import { userNameSelector } from "../../recoil/selectors";
import { useRecoilValue } from "recoil";

export default function TipCard({ tip, isAdmin, today }) {
  const [hidden, setHidden] = useState(true);
  const isPremiumUser = useRecoilValue(userNameSelector);

  useEffect(() => {
    if (isAdmin || isPremiumUser) {
      setHidden(false);
    } else if (tip.date === today && tip.premium) {
      setHidden(tip.status !== "finished");
    } else {
      setHidden(false);
    }
  }, [isPremiumUser, isAdmin, tip, today]);

  const getStatus = (tip) => {
    if (tip.status === "pending") {
      return { label: 'PENDING', className: 'status-pending', icon: '⏳' };
    } else if (tip.won === "won") {
      return { label: 'WON', className: 'status-won', icon: '✅' };
    } else {
      return { label: 'LOST', className: 'status-lost', icon: '❌' };
    }
  };

  const status = getStatus(tip);
  const isPremium = tip.premium;

  return (
    <div className={`tip-card ${isPremium ? 'premium' : ''}`}>
      <div className="tip-card-header">
        <div className="tip-meta">
          <span className="tip-time">{tip.time}</span>
          <span className={`tip-badge ${isPremium ? 'vip' : 'free'}`}>
            {isPremium ? '💎 VIP' : '🔓 Free'}
          </span>
        </div>
        <div className="tip-actions">
          <span className="tip-odd">Odd {tip.odd}</span>
          {isAdmin && (
            <NavLink className="tip-edit" to="/edit-tip" state={tip}>
              <BiEdit />
            </NavLink>
          )}
        </div>
      </div>

      <div className="tip-card-body">
        <div className="tip-teams">
          <span className={`team-name home ${hidden ? 'hidden' : ''}`}>
            {hidden ? 'Locked' : truncateTitle(tip.home, 50)}
          </span>
          <div className="tip-vs">
            <span className="vs-pick">{tip.pick}</span>
          </div>
          <span className={`team-name away ${hidden ? 'hidden' : ''}`}>
            {hidden ? 'Locked' : truncateTitle(tip.away, 50)}
          </span>
        </div>
      </div>

      <div className="tip-card-footer">
        <div className="tip-result">
          <span className="result-label">Result</span>
          <span className="result-score">{tip.results || '—'}</span>
        </div>
        <div className={`tip-status ${status.className}`}>
          <span className="status-icon">{status.icon}</span>
          <span className="status-label">{status.label}</span>
        </div>
      </div>
    </div>
  );
}
