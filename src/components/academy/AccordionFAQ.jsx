import { useId, useState } from "react";

export default function AccordionFAQ({ items = [] }) {
  const [open, setOpen] = useState(0);
  const baseId = useId();

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const panelId = `${baseId}-panel-${index}`;
        const buttonId = `${baseId}-button-${index}`;
        const isOpen = open === index;
        return (
          <div key={item.q} className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? -1 : index)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-[#00274c] hover:bg-slate-50"
              >
                <span>{item.q}</span>
                <span aria-hidden="true" className="text-[#c10020] text-xl leading-none">
                  {isOpen ? "−" : "+"}
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="px-5 pb-4 text-sm text-slate-600 leading-relaxed"
            >
              {item.a}
            </div>
          </div>
        );
      })}
    </div>
  );
}
