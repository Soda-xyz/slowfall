import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuthToken } from "../../lib/fetchClient";

export default function ProtectedRoute({
	children,
}: {
	children: React.ReactElement;
}): React.ReactElement | null {
	const token = getAuthToken();
	const navigate = useNavigate();
	const location = useLocation();

	React.useEffect(() => {
		if (!token) {
			navigate("/login", {
				replace: true,
				state: { from: location },
			});
		}
	}, [token, navigate, location]);

	if (!token) return null;
	return children;
}
