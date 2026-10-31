// Accessible modal: role="dialog" + aria-modal, Escape closes, Tab is trapped
// inside, focus returns to the opener on close, and the app behind is inert.
// Bottom sheet on phones, centered card from sm up. Motion animates open/close.
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const FOCUSABLE =
	'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])';

const DialogPanel = ({ onClose, labelledBy, dismissible, children, wide }) => {
	const panel = useRef(null);
	const reduce = useReducedMotion();

	useEffect(() => {
		const opener = document.activeElement;
		const root = document.getElementById("root");
		root?.setAttribute("inert", "");
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		// Focus the first control (or the panel itself).
		const first = panel.current?.querySelector("[data-autofocus]") ||
			panel.current?.querySelector(FOCUSABLE);
		(first || panel.current)?.focus();

		return () => {
			root?.removeAttribute("inert");
			document.body.style.overflow = prevOverflow;
			if (opener instanceof HTMLElement) opener.focus();
		};
	}, []);

	const onKeyDown = (e) => {
		if (e.key === "Escape" && dismissible) {
			e.stopPropagation();
			onClose();
			return;
		}
		if (e.key !== "Tab") return;
		const items = [...panel.current.querySelectorAll(FOCUSABLE)];
		if (!items.length) return;
		const [first, last] = [items[0], items[items.length - 1]];
		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first.focus();
		}
	};

	return (
		<motion.div
			className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
			onKeyDown={onKeyDown}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: reduce ? 0 : 0.18 }}
		>
			<div
				className="absolute inset-0 bg-[#050a14]/65 backdrop-blur-[3px]"
				onClick={() => dismissible && onClose()}
				aria-hidden="true"
			/>
			<motion.div
				ref={panel}
				role="dialog"
				aria-modal="true"
				aria-labelledby={labelledBy}
				tabIndex={-1}
				className={`surface relative max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl p-6 shadow-[0_30px_80px_-20px_rgba(5,10,20,0.6)] outline-none sm:rounded-2xl ${
					wide ? "sm:max-w-lg" : "sm:max-w-md"
				}`}
				initial={reduce ? false : { y: 40, opacity: 0.6, scale: 0.98 }}
				animate={{ y: 0, opacity: 1, scale: 1 }}
				exit={reduce ? { opacity: 0 } : { y: 30, opacity: 0, scale: 0.98 }}
				transition={{ type: "spring", stiffness: 420, damping: 34 }}
			>
				{children}
			</motion.div>
		</motion.div>
	);
};

// `open` drives presence so the exit animation can play.
const Dialog = ({ open, onClose, labelledBy, dismissible = true, wide, children }) =>
	createPortal(
		<AnimatePresence>
			{open && (
				<DialogPanel
					onClose={onClose}
					labelledBy={labelledBy}
					dismissible={dismissible}
					wide={wide}
				>
					{children}
				</DialogPanel>
			)}
		</AnimatePresence>,
		document.body,
	);

export default Dialog;
