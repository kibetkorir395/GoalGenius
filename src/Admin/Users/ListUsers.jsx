import {
	useEffect,
	useState,
	useMemo,
} from "react";
import UserCard from "../../components/UserCard/UserCard";
import { userState } from '../../recoil/atoms';
import { getAllusers } from "../../firebase";
import Loader from "../../components/Loader/Loader";
import { useRecoilValue } from "recoil";
import { useLocation } from "react-router-dom";
import './ListUsers.scss'

export default function ListUsers() {
	const [loading, setLoading] = useState(true);
	const [users, setUsers] = useState([]);
	//const { currentUser } = useContext(AuthContext);

	const user = useRecoilValue(userState);
    const location = useLocation();
	const [isAdmin, setIsAdmin] = useState(null);
	const [subscriptionFilter, setSubscriptionFilter] = useState("All");
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
        if (user && ['kkibetkkoir@gmail.com', 'charleykibet254@gmail.com', 'coongames8@gmail.com'].includes(user.email)) {
            setIsAdmin(true);
        } else {
            setIsAdmin(false);
        }
	}, [user]);

	const [isOnline] = useState(() => {
		return navigator.onLine;
	});

	useEffect(() => {
		if (isAdmin) {
			getAllusers(setUsers, setLoading);
		}
	}, [isOnline, isAdmin]);

	useEffect(() => {
		loading &&
			setTimeout(() => {
				setLoading(false);
			}, 2000);
	}, [loading]);

	// Filter and search logic
	const filteredUsers = useMemo(() => {
		return users.filter((user) => {
			// Filter by subscription type
			const subscriptionMatch =
				subscriptionFilter === "All" ||
				(subscriptionFilter === "Free" && !user.isPremium) ||
				(subscriptionFilter === "Premium" && user.isPremium);

			// Filter by search query (search in username, email, and subscription type)
			const searchMatch =
				searchQuery === "" ||
				(user.username &&
					user.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
				(user.email &&
					user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
				(user.subscription &&
					user.subscription.toLowerCase().includes(searchQuery.toLowerCase()));

			return subscriptionMatch && searchMatch;
		});
	}, [users, subscriptionFilter, searchQuery]);

	return (
		<div className="list-users">
			{loading && <Loader />}
			<div className="header">
				<input
					type="search"
					placeholder="Search by username, email or subscription..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
				{users.length > 0 && (
					<select
						onChange={(e) => setSubscriptionFilter(e.target.value)}
						value={subscriptionFilter}
					>
						<option value="All">All Users</option>
						<option value="Free">Free Users</option>
						<option value="Premium">Premium Users</option>
					</select>
				)}
			</div>

			{filteredUsers.length > 0
				? filteredUsers.map((user) => {
						return <UserCard key={user.email} user={user} />;
				  })
				: !loading && (
						<div className="no-results">
							No users found matching your criteria
						</div>
				  )}
		</div>
	);
}
