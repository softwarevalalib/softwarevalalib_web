import React from "react";

export default function Topbar() {
  return (
    <div className="hidden md:flex bg-slate-700 text-white w-full mx-auto items-center justify-between px-10 text-sm h-12 sticky top-0 z-50">
      <p className="uppercase text-orange-500 font-semibold">
        Software Vala Liberia, Inc.
      </p>
      <p>Email Address: softwarevalaliberiainc@gmail.com</p>
      <p>Location: ELWA Junction, Paynesville City, Monrovia, Liberia</p>
      <p className="list-none flex items-center justify-between gap-2 ">
        <li>Facebook</li>
        <li>Instagram</li>
        <li>Tiktok</li>
      </p>
    </div>
  );
}
