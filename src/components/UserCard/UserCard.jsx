import "./UserCard.scss";
import { BiUser, BiEnvelope } from "react-icons/bi";
import { MdLocationPin, MdAndroid } from 'react-icons/md';
import { RiMacbookFill } from "react-icons/ri";
import { FaInternetExplorer } from "react-icons/fa";
import { FaApple } from "react-icons/fa";
import { FaWindows } from "react-icons/fa";
import { FaLinux } from "react-icons/fa";
import { NavLink } from "react-router-dom";

const UserCard = ({ user }) => {
  function formatDate(dateString) {
    if (!dateString) return "Not subscribed";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    let day = date.getDate();
    const suffix = (d) => {
      if (d > 3 && d < 21) return "th";
      switch (d % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
      }
    };
    return `${day}${suffix(day)} ${date.toLocaleString("en-GB", { month: "long", year: "numeric" })}`;
  }

  const initials = (user.username || user.email || "U")
    .split(/[@\s]+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <NavLink
      className="user-card"
      to={`/users/${user.email}`}
      state={user}
    >
      <div className="user-card-top">
        <div className={`user-badge ${user.isPremium ? "premium" : "free"}`}>
          {user.isPremium ? "VIP" : "Free"}
        </div>
        <span className="plan-badge">
            {user.locality && <><MdLocationPin className="badge-icon" />{user.locality.city}, {user.locality.region}</>}
        </span>
      </div>
      <div className="user-card-body">
        <div className="user-avatar">
          <span>{initials}</span>
        </div>
        <div className="user-details">
          <div className="user-name">
            <div>
              <BiUser className="detail-icon" />
              <span>{user.username || "No username"}</span>
            </div>
              {user.visitedWebsites && (() => {
                    const firstWithDevice = Object.entries(user.visitedWebsites).find(
                        ([key, value]) => value && value.device
                    );

                    const siteData = firstWithDevice ? firstWithDevice[1] : null;
                    
                    // This is the object: e.g., { device: 'iOS' } or similar
                    const deviceObj = siteData ? siteData.device : null; 

                    // Adjust 'deviceObj.type' or 'deviceObj.name' if the string lives under a different key
                    const deviceName = deviceObj && typeof deviceObj === 'object' 
                        ? (deviceObj.device || deviceObj.type || "").toLowerCase() : "";

                    if (deviceName) {
                        switch (deviceName) {
                            case 'ios':
                            case 'mac':
                                return <FaApple className="detail-icon"/>;
                            case 'android':
                                return <MdAndroid className="detail-icon"/>;
                            case 'windows':
                                return <FaWindows className="detail-icon"/>;
                            case 'linux':
                                return <FaLinux />;
                            default:
                                return <FaInternetExplorer className="detail-icon"/>;
                        }
                    }
                    return null; // Return null if no device match is found
                })()}
          </div>
          <div className="user-email">
            <BiEnvelope className="detail-icon" />
            <span>{user.email}</span>
          </div>
          <div className="user-plan">
            Plan: { user.subscription && user.subscription.plan || "None" }
          </div>
          <div className="user-sub-date">
            {(user.subscription && user.subscription.subDate) ? formatDate(user.subscription.subDate) : "Never subscribed"}
          </div>
        </div>
      </div>
    </NavLink>
  );
};

export default UserCard;
