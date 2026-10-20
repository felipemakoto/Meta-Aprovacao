import Image from "next/image";

export function MetaMark() {
  return <Image src="/icon.svg" width={44} height={44} alt="" unoptimized />;
}

export function HomeIcon({ name }: { name: "book" | "timer" | "arrow" }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {name === "book" && <><path d="M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1ZM12 5v15" /><path d="M5 8h4M15 8h4" /></>}
      {name === "timer" && <><circle cx="12" cy="14" r="8" /><path d="M9 2h6M12 2v4M18 6l2-2M12 14l3-4" /></>}
      {name === "arrow" && <path d="M4 12h16m-6-6 6 6-6 6" />}
    </svg>
  );
}

export function StudyArtwork() {
  return (
    <svg viewBox="0 0 460 400" fill="none" aria-hidden="true">
      <circle cx="235" cy="204" r="164" fill="#EDF3E9" />
      <circle cx="364" cy="79" r="21" fill="#F3CF69" />
      <path d="m75 156 141 41v137L75 293Z" fill="#237B38" />
      <path d="m216 197 152-59v137l-152 59Z" fill="#185D29" />
      <path d="m88 137 128 39v137L88 274Z" fill="#FCFDFB" stroke="#19241F" strokeWidth="2" strokeLinejoin="round" />
      <path d="m216 176 139-58v137l-139 58Z" fill="#E0EFDF" stroke="#19241F" strokeWidth="2" strokeLinejoin="round" />
      <path d="m112 179 74 23m-74 7 74 23m-74 7 43 13" stroke="#ADBFA8" strokeWidth="3" strokeLinecap="round" />
      <path d="m245 209 23 21 52-62" stroke="#237B38" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m291 138 19-8v62l-10-7-9 15Z" fill="#F3CF69" />
      <path d="m122 99 8-21m13 29 16-16" stroke="#6653AD" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
