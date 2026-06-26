import AppHelmet from '../AppHelmet';
import ScrollToTop from '../ScrollToTop';
import './NotFound.scss';

export default function NotFound() {
  return (
    <div className='not-found'>
        <AppHelmet title={"404 Error"}/>
        <ScrollToTop />
        <span className="not-found-code">404</span>
        <h2>Page Not Found</h2>
        <p>The page you are looking for does not exist or has been moved.</p>
        <button onClick={() => window.history.back()} className='btn'>Go Back</button>
    </div>
  )
}
