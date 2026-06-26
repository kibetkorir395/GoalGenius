import './Loader.scss';

export default function Loader() {
  return (
    <div className="loader">
      <div className="loader-ring">
        <span className="loader-dot" />
      </div>
      <p className="loader-text">Loading...</p>
    </div>
  );
}
