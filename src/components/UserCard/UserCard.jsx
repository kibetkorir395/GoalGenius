import "./UserCard.scss";
import { BiUser, BiEnvelope } from "react-icons/bi";
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
      </div>
      <div className="user-card-body">
        <div className="user-avatar">
          <span>{initials}</span>
        </div>
        <div className="user-details">
          <div className="user-name">
            <BiUser className="detail-icon" />
            <span>{user.username || "No username"}</span>
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
