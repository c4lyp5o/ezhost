// Unknown client route. (Missing files and unknown /api paths get a real
// 404 from the server; this only covers app URLs.)
import { Link } from "react-router-dom";
import Wordmark from "../components/Wordmark.jsx";

const NotFound = () => (
	<div className="flex min-h-dvh flex-col items-start justify-center gap-5 bg-[var(--surface-0)] px-6 sm:px-16">
		<Wordmark size={34} />
		<h1 className="display max-w-[20ch] text-[24px] font-semibold">
			This page isn't on the manifest.
		</h1>
		<p className="text-[13px] text-[var(--text-low)]">The address might be mistyped, or the page was moved.</p>
		<Link to="/" className="btn-label inline-flex h-[34px] items-center px-4 text-[13px]">
			See hosted files
		</Link>
	</div>
);

export default NotFound;
