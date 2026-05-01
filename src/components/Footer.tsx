/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export default function Footer() {
  return (
    <footer
      className="bg-white border-t border-slate-200 py-3 px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-3"
      aria-label="Site footer"
    >
      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
        &copy; {new Date().getFullYear()} National Election Assistant Project
      </p>
      <p className="text-[10px] text-slate-400 text-center">
        Information is provided for civic guidance only. Always verify with your
        official Election Commission.
      </p>
      <nav aria-label="Footer links">
        <ul className="flex gap-5 list-none m-0 p-0">
          {["Privacy", "Security", "Accessibility"].map((label) => (
            <li key={label}>
              <a
                href="#"
                className="text-[10px] font-bold text-slate-400 hover:text-blue-700 transition-colors uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                aria-label={label + " policy"}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  );
}
