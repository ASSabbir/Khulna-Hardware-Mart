import React from "react";
import { FiTool, FiCode } from "react-icons/fi";

const Footer = () => {
  return (
    <footer className="bg-blue-900 border-t-[3px] border-orange-500 w-full mt-auto font-[Barlow]">

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 
                      flex flex-col md:flex-row items-center justify-between 
                      gap-2 md:gap-3 py-3 md:h-12 text-center md:text-left">

        {/* LEFT */}
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-start 
                        gap-1 md:gap-2 text-[11px] md:text-xs text-blue-200 flex-wrap">

          <div className="flex items-center gap-2 justify-center">
            <span className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center text-white">
              <FiTool size={12} />
            </span>

            <span className="font-bold uppercase tracking-wide text-white font-[Barlow_Condensed] text-[12px] md:text-[13px]">
              Khulna <span className="text-orange-500">Hardware</span> Mart
            </span>
          </div>

          <div className="hidden md:block text-blue-400">|</div>

          <span className="text-center">
            280-Khanjahan Ali Road (Rahmania Madrasha Complex), Khulna
          </span>

          <div className="hidden md:block text-blue-400">·</div>

          <span>02477-721990</span>
          <span>+880 1931-272839</span>
          <span>+880 1679-123205</span>
        </div>

        {/* CENTER */}
        <div className="text-slate-300 text-[11px] md:text-xs whitespace-normal md:whitespace-nowrap">
          © {new Date().getFullYear()} Khulna Hardware Mart. All rights reserved.
        </div>

        {/* RIGHT */}
        <div className="flex items-center justify-center md:justify-end gap-1 text-blue-200 text-[11px] md:text-xs">
          <FiCode size={12} />
          <span>Developed by</span>
          <span className="text-yellow-400 font-bold">
            Techof Solution LTD.
          </span>
        </div>

      </div>
    </footer>
  );
};

export default Footer;