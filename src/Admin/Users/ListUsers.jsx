import { useEffect, useState, useMemo } from "react";
import UserCard from "../../components/UserCard/UserCard";
import { userState } from '../../recoil/atoms';
import { getAllusers } from "../../firebase";
import Loader from "../../components/Loader/Loader";
import { useRecoilValue } from "recoil";
import { useNavigate } from "react-router-dom";
import './ListUsers.scss'
import { FiSearch, FiUsers } from 'react-icons/fi';

const ADMIN_EMAILS = ['kkibetkkoir@gmail.com', 'charleykibet254@gmail.com', 'coongames8@gmail.com'];

export default function ListUsers() {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const user = useRecoilValue(userState);
    const navigate = useNavigate();
    const [isAdmin, setIsAdmin] = useState(false);
    const [subscriptionFilter, setSubscriptionFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (user && ADMIN_EMAILS.includes(user.email)) {
            setIsAdmin(true);
        } else {
            setIsAdmin(false);
        }
    }, [user]);

    useEffect(() => {
        if (!isAdmin) {
            //navigate('/', { replace: true });
        }
    }, [isAdmin, navigate]);

    useEffect(() => {
        if (isAdmin) {
            getAllusers(setUsers, setLoading);
        }
    }, [isAdmin]);

    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const subscriptionMatch =
                subscriptionFilter === "All" ||
                (subscriptionFilter === "Free" && !user.isPremium) ||
                (subscriptionFilter === "Premium" && user.isPremium);

            const searchMatch =
                searchQuery === "" ||
                (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))// ||
                //(user.subscription && user.subscription.toLowerCase().includes(searchQuery.toLowerCase()));

            return subscriptionMatch && searchMatch;
        });
    }, [users, subscriptionFilter, searchQuery]);

    const stats = useMemo(() => {
        return {
            total: users.length,
            premium: users.filter(u => u.isPremium).length,
            free: users.filter(u => !u.isPremium).length,
        };
    }, [users]);

    useEffect(() => {
        users && console.log(users)
    }, [users]);

    return (
        <div className="list-users">
            {loading && <Loader />}
            <div className="list-users-header">
                <h2 className="section-title">All Users</h2>
                <p className="section-subtitle">Manage and view all registered users</p>
            </div>

            <div className="stats-bar">
                <div className="stat-item">
                    <FiUsers />
                    <span className="stat-value">{stats.total}</span>
                    <span className="stat-label">Total</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{stats.premium}</span>
                    <span className="stat-label">Premium</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{stats.free}</span>
                    <span className="stat-label">Free</span>
                </div>
            </div>

            <div className="users-toolbar">
                <div className="search-box">
                    <FiSearch className="search-icon" />
                    <input
                        type="search"
                        placeholder="Search by username, email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                {users.length > 0 && (
                    <select
                        onChange={(e) => setSubscriptionFilter(e.target.value)}
                        value={subscriptionFilter}
                        className="filter-select"
                    >
                        <option value="All">All Users</option>
                        <option value="Free">Free Users</option>
                        <option value="Premium">Premium Users</option>
                    </select>
                )}
            </div>

            <div className="users-grid">
                {filteredUsers.length > 0
                    ? filteredUsers.map((user) => (
                        <UserCard key={user.email} user={user} />
                    ))
                    : !loading && (
                        <div className="no-results">
                            No users found matching your criteria
                        </div>
                    )}
            </div>
        </div>
    );
}
