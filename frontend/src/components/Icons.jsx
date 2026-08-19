// Light-weight, lucide-style stroke icon set — replaces emoji across the UI.
// Each icon is a self-closing SVG with currentColor stroke, so size/color come
// from CSS (w-4 h-4, text-<color>, etc.).
const S = ({ children, size = 20, ...props }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.7"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
		{...props}
	>
		{children}
	</svg>
);

export const IconFolder = (p) => (
	<S {...p}>
		<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
	</S>
);

export const IconFile = (p) => (
	<S {...p}>
		<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
		<path d="M14 2v6h6" />
	</S>
);

export const IconFileText = (p) => (
	<S {...p}>
		<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
		<path d="M14 2v6h6" />
		<path d="M8 13h8M8 17h5" />
	</S>
);

export const IconImage = (p) => (
	<S {...p}>
		<rect x="3" y="3" width="18" height="18" rx="2" />
		<circle cx="9" cy="9" r="2" />
		<path d="M21 15l-5-5L5 21" />
	</S>
);

export const IconFilm = (p) => (
	<S {...p}>
		<rect x="3" y="3" width="18" height="18" rx="2" />
		<path d="M7 3v18M17 3v18M3 8h4M3 16h4M17 8h4M17 16h4" />
	</S>
);

export const IconMusic = (p) => (
	<S {...p}>
		<path d="M9 18V5l12-2v13" />
		<circle cx="6" cy="18" r="3" />
		<circle cx="18" cy="16" r="3" />
	</S>
);

export const IconArchive = (p) => (
	<S {...p}>
		<rect x="2" y="3" width="20" height="5" rx="1" />
		<path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
		<path d="M10 12h4" />
	</S>
);

export const IconCode = (p) => (
	<S {...p}>
		<path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
	</S>
);

export const IconBox = (p) => (
	<S {...p}>
		<path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
		<path d="M3 8l9 5 9-5M12 13v8" />
	</S>
);

export const IconPdf = (p) => (
	<S {...p}>
		<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
		<path d="M14 2v6h6" />
		<path d="M8.5 16.5H10a1.5 1.5 0 0 0 0-3H8.5v3z" />
		<path d="M12.5 13.5h.5a2 2 0 0 1 0 4h-.5" />
		<path d="M16 13.5v4" />
	</S>
);

export const IconSearch = (p) => (
	<S {...p}>
		<circle cx="11" cy="11" r="8" />
		<path d="M21 21l-4.3-4.3" />
	</S>
);

export const IconUpload = (p) => (
	<S {...p}>
		<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
		<path d="M17 8l-5-5-5 5M12 3v12" />
	</S>
);

export const IconTrash = (p) => (
	<S {...p}>
		<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
		<path d="M10 11v6M14 11v6" />
	</S>
);

export const IconPlus = (p) => (
	<S {...p}>
		<path d="M12 5v14M5 12h14" />
	</S>
);

export const IconX = (p) => (
	<S {...p}>
		<path d="M18 6L6 18M6 6l12 12" />
	</S>
);

export const IconCopy = (p) => (
	<S {...p}>
		<rect x="9" y="9" width="13" height="13" rx="2" />
		<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
	</S>
);

export const IconLogout = (p) => (
	<S {...p}>
		<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
	</S>
);

export const IconSun = (p) => (
	<S {...p}>
		<circle cx="12" cy="12" r="4" />
		<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
	</S>
);

export const IconMoon = (p) => (
	<S {...p}>
		<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
	</S>
);

export const IconExternal = (p) => (
	<S {...p}>
		<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
	</S>
);

export const IconLock = (p) => (
	<S {...p}>
		<rect x="3" y="11" width="18" height="11" rx="2" />
		<path d="M7 11V7a5 5 0 0 1 10 0v4" />
	</S>
);

export const IconFolderPlus = (p) => (
	<S {...p}>
		<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
		<path d="M12 11v6M9 14h6" />
	</S>
);

export const IconCheck = (p) => (
	<S {...p}>
		<path d="M20 6L9 17l-5-5" />
	</S>
);

export const IconLoader = (p) => (
	<S {...p} className={`animate-spin ${p?.className || ""}`} size={16}>
		<path d="M21 12a9 9 0 1 1-6.2-8.56" />
	</S>
);

export const IconInbox = (p) => (
	<S {...p}>
		<path d="M22 12h-6l-2 3h-4l-2-3H2" />
		<path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
	</S>
);

export const IconCloud = (p) => (
	<S {...p}>
		<path d="M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9z" />
	</S>
);

export const IconShield = (p) => (
	<S {...p}>
		<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
	</S>
);

export const IconChevron = (p) => (
	<S {...p}>
		<path d="M9 18l6-6-6-6" />
	</S>
);