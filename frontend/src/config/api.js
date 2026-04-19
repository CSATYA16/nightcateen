// Central API base URL — automatically uses live URL in production, local in dev
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default API_BASE;
