"use client";
import React from "react";
import Link from "next/link";

const Navbar = () => {
  return (
    <>
      {" "}
      <nav className="flex justify-between items-center px-8 py-4 shadow-md bg-white">
        <div className="text-2xl font-bold text-indigo-600">JANVICHAAR</div>
        <ul className="flex space-x-6 text-gray-700 font-medium">
          <li>
            <Link href="/" className="hover:text-indigo-600">
              Home
            </Link>
          </li>
          <li>
            <Link href="/feedbackform" className="hover:text-indigo-600">
              Submit Feedback
            </Link>
          </li>
          <li>
            <Link href="/govlogin" className="hover:text-indigo-600">
              Gov Login
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
};

export default Navbar;
