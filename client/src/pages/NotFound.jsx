import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-base-200 p-6">
    <div className="text-center max-w-md">
      <h1 className="font-display text-8xl font-bold text-primary/20 mb-4">404</h1>
      <h2 className="font-display text-2xl font-bold mb-3">Page Not Found</h2>
      <p className="text-base-content/60 mb-6">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
    </div>
  </div>
);

export default NotFound;
