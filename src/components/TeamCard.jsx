import React from "react";
import Team from "../data/Team";
import Footer from "../components/Footer";

function TeamCard() {
  return (
    <>
      <div className="lg:px-30 md:px-25 py-10">
        <h1 className="text-center text-xl md:text-2xl lg:text-3xl font-semibold py-5">
          The Team of Experience Engineers
        </h1>
        <div className="flex flex-col items-center justify-between py-5 gap-7 md:grid md:grid-cols-2 lg:grid-cols-3 md:items-center md:justify-center ">
          {Team.map((Teammember) => {
            return (
              <div
                key={Teammember.id}
                className=" py-8 shadow  w-75 h-80 flex flex-col  items-center  transition-all duration-300 rounded-2xl text-center "
              >
                <img
                  src={Teammember.img}
                  alt=""
                  className="rounded-full w-25 h-auto  hover:border-2 hover:scale-110 border-slate-950 transition-all duration-150 mb-3 "
                />
                <h3 className="text-[1.1rem] font-semibold">
                  {Teammember.Name}
                </h3>
                <p className="text-sm text-gray-500 text-center hover:text-orange-500 transition-all duration-400 font-semibold">
                  {Teammember.Position}
                </p>
                <p className="pt-3 px-auto text-sm text-center px-3 pb-10">
                  {Teammember.Biography}
                </p>
              </div>
            );
          })}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default TeamCard;
