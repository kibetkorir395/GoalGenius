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

            if (tip.status !== "finished") {
                setHidden(true);
            } else {
                setHidden(false);
            }

        } else {
            setHidden(false);
        }

    }, [isPremiumUser, isAdmin, tip]);

    function getTipStatus(tip) {
        if (tip.status === "pending") {
            return (
                <span className="pending">
                    pend🔄
                </span>
            );
        } else if (tip.won === "won") {
            return (
                <span className="won">
                    won✅
                </span>
            );
        } else {
            return (
                <span className="lost">
                    lost❌
                </span>
            );
        }
    }


    return (
        <div className="tip-card" style={{ borderLeft: tip.premium ? "2px solid gold" : "2px solid silver" }}>
            <div className="top">
                <p style={{
                    backgroundColor: tip.premium ? "gold" : "silver",
                    padding: '3px',
                }}>odd: {tip.odd}</p>
                {isAdmin && <NavLink to={"/edit-tip"} state={tip}><BiEdit /></NavLink>}
                {<div className="tag" style={{ backgroundColor: tip.premium ? "gold" : "white" }}>{tip.premium ? "💎" : "🔓"}</div>}
            </div>

            <div className="center">
                <div className='info time-card'>
                    <p>{tip.time}</p>
                </div>
                <div className="teams">
                    <p className={`name ${hidden && "hidden"}`}>{!hidden ? `${truncateTitle(tip.home, 60)}` : "CLOSED"}</p>
                    <div className="results">{tip.pick}</div>
                    <p className={`name ${hidden && "hidden"}`} > {!hidden ? `${truncateTitle(tip.away, 60)}` : "CLOSED"}</p>
                </div>
                <div className='info'>
                    <p>{tip.results ? tip.results : "?-?"}</p>
                    <p>{getTipStatus(tip)}</p>
                </div>
            </div>
        </div>)
}
