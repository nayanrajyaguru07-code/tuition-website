"use client";

import React, { FC } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react";
import Link from "next/link";

const Footer: FC = () => {
  const linkVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <motion.footer
      className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 w-full border-t border-slate-200 dark:border-slate-800 mt-auto"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ staggerChildren: 0.1 }}
    >
      <div className="container mx-auto px-4 py-10">
        {/* 4-column grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={linkVariants}
        >
          {/* Column 1 */}
          <div className="space-y-4">
            <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
              SMV High School
            </h5>
            <p className="flex items-start space-x-2">
              <MapPin className="w-5 h-5 mt-1 flex-shrink-0 text-gray-500" />
              <span>123 Education Ave, Cityville, State 12345, India</span>
            </p>
            <p className="flex items-center space-x-2">
              <Phone className="w-5 h-5 flex-shrink-0 text-gray-500" />
              <a
                href="tel:+911234567890"
                className="hover:text-blue-600 transition-colors"
              >
                +91 12345 67890
              </a>
            </p>
            <p className="flex items-center space-x-2">
              <Mail className="w-5 h-5 flex-shrink-0 text-gray-500" />
              <a
                href="mailto:info@smvhighschool.edu"
                className="hover:text-blue-600 transition-colors"
              >
                info@smvhighschool.edu
              </a>
            </p>
          </div>

          {/* Column 2 */}
          <div>
            <h5 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Quick Links
            </h5>
            <ul className="space-y-2">
              {[
                "Parent Portal",
                "Student Portal",
                "Academic Calendar",
                "Faculty Directory",
                "News & Events",
              ].map((text) => (
                <li key={text}>
                  <a href="#" className="hover:text-blue-600 transition-colors">
                    {text}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h5 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              About SMV
            </h5>
            <ul className="space-y-2">
              {[
                "Our Mission & Vision",
                "Admissions",
                "Careers",
                "Contact Us",
                "Our Campus",
              ].map((text) => (
                <li key={text}>
                  <a href="#" className="hover:text-blue-600 transition-colors">
                    {text}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 */}
          <div>
            <h5 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Connect With Us
            </h5>
            <div className="flex space-x-4">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <Link
                  key={i}
                  href="#"
                  className="text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <Icon className="w-6 h-6" />
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.footer>
  );
};

export default Footer;
