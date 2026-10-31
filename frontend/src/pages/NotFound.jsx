// Unknown client route. (Missing files and unknown /api paths get a real
// 404 from the server; this only covers app URLs.)
import { Link } from "react-router-dom";
import Wordmark from "../components/Wordmark.jsx";

const NotFound = () => (
	<div className="flex min-h-dvh flex-col items-start justify-center gap-5 bg-[var(--surface-0)] px-6 sm:px-16">
		<Wordmark size={34} />
		<h1 className="display max-w-[16ch] font-extrabold" style={{ fontSize: "clamp(2.4rem, 7vw, 4.5rem)" }}>
			This page isn't on the manifest.
		</h1>
		<p className="text-[var(--text-mid)]">The address might be mistyped, or the page was moved.</p>
		<Link to="/" className="btn-label rounded-xl px-5 py-3 text-[15px]">
			See hosted files
		</Link>
	</div>
);

export default NotFound;
